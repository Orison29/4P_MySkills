"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeProjectWithLLM = void 0;
const generative_ai_1 = require("@google/generative-ai");
const client_1 = require("@prisma/client");
const env_1 = require("../../config/env");
const db_1 = require("../../utils/db");
const deliverable_service_1 = require("../deliverables/deliverable.service");
const deliverable_skill_service_1 = require("../deliverable-skills/deliverable-skill.service");
/**
 * Analyze project and generate deliverables with skill requirements using Gemini AI
 */
const analyzeProjectWithLLM = async (projectId, projectName, projectDescription, userPrompt) => {
    // Get project to verify it exists
    const project = await db_1.prisma.project.findUnique({
        where: { id: projectId }
    });
    if (!project) {
        throw new Error("Project not found");
    }
    // Get all available skills from the system
    const availableSkills = await db_1.prisma.skill.findMany({
        select: {
            name: true,
            description: true
        }
    });
    if (availableSkills.length === 0) {
        throw new Error("No skills available in the system. Please create skills first.");
    }
    // Format skills for the prompt
    const skillsList = availableSkills
        .map((s) => `- ${s.name}${s.description ? `: ${s.description}` : ""}`)
        .join("\n");
    // Initialize Gemini
    const genAI = new generative_ai_1.GoogleGenerativeAI(env_1.ENV.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const extraContext = userPrompt?.trim()
        ? `\nAdditional Context from HR:\n${userPrompt.trim()}\n`
        : "";
    // Create the prompt
    const prompt = `You are a project management assistant. Analyze this project and break it down into deliverables with skill requirements and tasks.

Project Name: ${projectName}
Project Description: ${projectDescription}
${extraContext}

Available Skills in System:
${skillsList}

Instructions:
1. Break the project into 3-5 major deliverables
2. For each deliverable, generate exactly 3 concrete tasks
3. For each deliverable, assign 2-4 skills from the AVAILABLE SKILLS LIST ONLY
4. Assign weight (0.0 to 1.0) for each skill based on importance (1.0 = most critical)
5. Use ONLY the skill names exactly as listed above

Return a JSON response (no markdown, just raw JSON):
{
  "deliverables": [
    {
      "name": "Deliverable Name",
      "description": "Brief description",
			"tasks": ["Task 1", "Task 2", "Task 3"],
      "skills": [
        { "skillName": "Exact Skill Name", "weight": 0.9 }
      ]
    }
  ]
}`;
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        // Clean the response (remove markdown code blocks if present)
        let cleanedText = text.trim();
        if (cleanedText.startsWith("```json")) {
            cleanedText = cleanedText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
        }
        else if (cleanedText.startsWith("```")) {
            cleanedText = cleanedText.replace(/```\n?/g, "");
        }
        const llmResponse = JSON.parse(cleanedText);
        // Create deliverables and assign skills
        const createdDeliverables = [];
        for (const deliverable of llmResponse.deliverables) {
            // Create deliverable
            const createdDeliverable = await (0, deliverable_service_1.createDeliverable)(projectId, deliverable.name, deliverable.description);
            const taskTitles = Array.isArray(deliverable.tasks)
                ? deliverable.tasks.map((task) => task.trim()).filter((task) => task.length > 0)
                : [];
            const normalizedTasks = taskTitles.length > 0
                ? taskTitles.slice(0, 3)
                : [
                    `Plan ${deliverable.name}`,
                    `Implement ${deliverable.name}`,
                    `QA ${deliverable.name}`
                ];
            // Assign skills
            const assignedSkills = [];
            for (const skillReq of deliverable.skills) {
                // Find skill by name
                const skill = availableSkills.find((s) => s.name.toLowerCase() === skillReq.skillName.toLowerCase());
                if (skill) {
                    // Get full skill ID
                    const fullSkill = await db_1.prisma.skill.findUnique({
                        where: { name: skill.name }
                    });
                    if (fullSkill) {
                        try {
                            await (0, deliverable_skill_service_1.addSkillToDeliverable)(createdDeliverable.id, fullSkill.id, skillReq.weight);
                            assignedSkills.push({
                                skillName: skill.name,
                                weight: skillReq.weight
                            });
                        }
                        catch (error) {
                            // Skip if skill already added or weight invalid
                            console.warn(`Could not add skill ${skill.name}:`, error);
                        }
                    }
                }
            }
            await db_1.prisma.task.createMany({
                data: normalizedTasks.map((title) => ({
                    title,
                    status: client_1.TaskStatus.PENDING,
                    projectId: projectId,
                    deliverableId: createdDeliverable.id
                }))
            });
            createdDeliverables.push({
                ...createdDeliverable,
                assignedSkills,
                tasks: normalizedTasks
            });
        }
        return {
            projectId,
            deliverablesCreated: createdDeliverables.length,
            deliverables: createdDeliverables
        };
    }
    catch (error) {
        console.error("LLM Analysis Error:", error);
        throw new Error("Failed to analyze project with AI. Please try again.");
    }
};
exports.analyzeProjectWithLLM = analyzeProjectWithLLM;
