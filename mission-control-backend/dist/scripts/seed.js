"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
async function seed() {
    console.log('🌱 Seeding database...');
    try {
        // Create sample agents
        const agents = await Promise.all([
            prisma.agent.create({
                data: {
                    name: 'Alpha-1',
                    description: 'Primary reconnaissance and data collection agent',
                    status: 'IDLE',
                    capabilities: ['reconnaissance', 'data-collection', 'analysis'],
                    metadata: {
                        version: '2.1.0',
                        specialization: 'intelligence-gathering',
                        region: 'north-sector',
                    },
                },
            }),
            prisma.agent.create({
                data: {
                    name: 'Beta-2',
                    description: 'Combat and security operations specialist',
                    status: 'IDLE',
                    capabilities: ['combat', 'security', 'threat-assessment'],
                    metadata: {
                        version: '2.0.5',
                        specialization: 'tactical-operations',
                        region: 'south-sector',
                    },
                },
            }),
            prisma.agent.create({
                data: {
                    name: 'Gamma-3',
                    description: 'Engineering and technical support agent',
                    status: 'BUSY',
                    capabilities: ['engineering', 'repair', 'technical-support'],
                    metadata: {
                        version: '1.9.8',
                        specialization: 'technical-operations',
                        region: 'central-hub',
                    },
                },
            }),
        ]);
        console.log(`✅ Created ${agents.length} agents`);
        // Create sample missions
        const missions = await Promise.all([
            prisma.mission.create({
                data: {
                    title: 'Sector 7 Reconnaissance',
                    description: 'Conduct thorough reconnaissance of Sector 7 to identify potential threats and resources',
                    status: 'IN_PROGRESS',
                    priority: 'HIGH',
                    progress: 35,
                    agentId: agents[0].id, // Alpha-1
                    startedAt: new Date(),
                    metadata: {
                        sector: 'sector-7',
                        estimatedDuration: '4 hours',
                        riskLevel: 'medium',
                    },
                },
            }),
            prisma.mission.create({
                data: {
                    title: 'Base Security Audit',
                    description: 'Perform comprehensive security audit of main base facilities',
                    status: 'PENDING',
                    priority: 'MEDIUM',
                    progress: 0,
                    agentId: agents[1].id, // Beta-2
                    metadata: {
                        facility: 'main-base',
                        auditType: 'security',
                        clearanceRequired: 'level-3',
                    },
                },
            }),
            prisma.mission.create({
                data: {
                    title: 'Communication Array Maintenance',
                    description: 'Routine maintenance and system updates for the primary communication array',
                    status: 'IN_PROGRESS',
                    priority: 'URGENT',
                    progress: 75,
                    agentId: agents[2].id, // Gamma-3
                    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // Started 2 hours ago
                    metadata: {
                        system: 'comm-array-primary',
                        maintenanceType: 'routine',
                        downtime: 'minimal',
                    },
                },
            }),
            prisma.mission.create({
                data: {
                    title: 'Resource Survey: Mining Outpost Delta',
                    description: 'Survey and assess resource availability at Mining Outpost Delta',
                    status: 'COMPLETED',
                    priority: 'LOW',
                    progress: 100,
                    startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Started 24 hours ago
                    completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // Completed 2 hours ago
                    metadata: {
                        location: 'mining-outpost-delta',
                        surveyType: 'resource-assessment',
                        outcome: 'resources-available',
                    },
                },
            }),
        ]);
        console.log(`✅ Created ${missions.length} missions`);
        // Create sample comments
        const comments = await Promise.all([
            // Comments for Alpha-1's mission
            prisma.comment.create({
                data: {
                    content: 'Mission commenced. Initial perimeter scan shows no immediate threats.',
                    type: 'SYSTEM',
                    agentId: agents[0].id,
                    missionId: missions[0].id,
                    metadata: {
                        automated: true,
                        timestamp: new Date(),
                    },
                },
            }),
            prisma.comment.create({
                data: {
                    content: 'Sector 7 eastern quadrant cleared. Moving to central area.',
                    type: 'NOTE',
                    agentId: agents[0].id,
                    missionId: missions[0].id,
                    metadata: {
                        location: 'sector-7-east',
                        status: 'cleared',
                    },
                },
            }),
            // Comments for Beta-2's mission
            prisma.comment.create({
                data: {
                    content: 'Security audit scheduled for 0800 hours tomorrow.',
                    type: 'NOTE',
                    agentId: agents[1].id,
                    missionId: missions[1].id,
                    metadata: {
                        scheduledTime: '2024-01-15T08:00:00Z',
                    },
                },
            }),
            // Comments for Gamma-3's mission
            prisma.comment.create({
                data: {
                    content: 'Primary communication array offline for maintenance. Backup systems active.',
                    type: 'WARNING',
                    agentId: agents[2].id,
                    missionId: missions[2].id,
                    metadata: {
                        systemStatus: 'maintenance-mode',
                        backup: 'active',
                    },
                },
            }),
            prisma.comment.create({
                data: {
                    content: 'Firmware update completed successfully. System performance improved by 15%.',
                    type: 'SUCCESS',
                    agentId: agents[2].id,
                    missionId: missions[2].id,
                    metadata: {
                        updateType: 'firmware',
                        performanceGain: '15%',
                    },
                },
            }),
            // General system comments
            prisma.comment.create({
                data: {
                    content: 'System maintenance window scheduled for this weekend.',
                    type: 'SYSTEM',
                    metadata: {
                        maintenanceWindow: '2024-01-20T02:00:00Z',
                        duration: '4 hours',
                    },
                },
            }),
        ]);
        console.log(`✅ Created ${comments.length} comments`);
        // Display summary
        console.log('\n🎉 Database seeded successfully!');
        console.log('\n📊 Summary:');
        console.log(`   Agents: ${agents.length}`);
        console.log(`   Missions: ${missions.length}`);
        console.log(`   Comments: ${comments.length}`);
        console.log('\n🚀 Your Mission Control backend is ready to use!');
    }
    catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
// Run seed if called directly
if (require.main === module) {
    seed();
}
exports.default = seed;
//# sourceMappingURL=seed.js.map