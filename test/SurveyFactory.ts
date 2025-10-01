import { expect } from "chai";
import { network } from "hardhat";

interface Question {
    question: string;
    options: string[];
}

interface SurveySchema {
    title: string;
    description: string;
    targetNumber: number;
    questions: Question[];
}

describe("SurveyFactory Contract", () => {
    let factory: any, owner: any, respondent1: any, respondent2: any;

    beforeEach(async () => {
        const { ethers } = await network.connect();
        [owner, respondent1, respondent2] = await ethers.getSigners();

        factory = await ethers.deployContract("SurveyFactory", [
            ethers.parseEther("50"), // min_pool_amount
            ethers.parseEther("0.1"), // min_reward_amount
        ]);
    });

    it("should deploy with correct minimum amounts", async () => {
        const { ethers } = await network.connect();

        // 경계값 성공
        const schemaOk: SurveySchema = {
            title: "제목",
            description: "설명",
            targetNumber: 500,
            questions: [{ question: "Q1", options: ["A", "B", "C"] }],
        };
        await expect(
            factory.createSurvey(
                schemaOk,
                { value: ethers.parseEther("50") }
            )
        ).to.emit(factory, "SurveyCreated");

        // 풀 금액 부족
        const schemaPoolSmall: SurveySchema = {
            title: "제목",
            description: "설명",
            targetNumber: 500,
            questions: [{ question: "Q1", options: ["A", "B", "C"] }],
        };
        await expect(
            factory.createSurvey(
                schemaPoolSmall,
                { value: ethers.parseEther("49.99") }
            )
        ).to.be.revertedWith("Insufficient pool amount");

        // 1인당 리워드 부족
        const schemaRewardSmall: SurveySchema = {
            title: "제목",
            description: "설명",
            targetNumber: 501,
            questions: [{ question: "Q1", options: ["A", "B", "C"] }],
        };
        await expect(
            factory.createSurvey(
                schemaRewardSmall,
                { value: ethers.parseEther("50") }
            )
        ).to.be.revertedWith("Insufficient reward amount");
    });

    it("should create a new survey when valid values are provided", async () => {
        const { ethers } = await network.connect();
        const before = await factory.getSurveys();

        const schemaCreate: SurveySchema = {
            title: "제목",
            description: "설명",
            targetNumber: 100,
            questions: [{ question: "Q1", options: ["A", "B", "C"] }],
        };
        await expect(
            factory.createSurvey(
                schemaCreate,
                { value: ethers.parseEther("100") }
            )
        ).to.emit(factory, "SurveyCreated");

        const after = await factory.getSurveys();
        expect(after.length).to.equal(before.length + 1);
    });

    it("should revert if pool amount is too small", async () => {
        const { ethers } = await network.connect();
        const schemaSmallPool: SurveySchema = {
            title: "제목",
            description: "설명",
            targetNumber: 100,
            questions: [{ question: "Q1", options: ["A", "B", "C"] }],
        };
        await expect(
            factory.createSurvey(
                schemaSmallPool,
                { value: ethers.parseEther("49.9") }
            )
        ).to.be.revertedWith("Insufficient pool amount");
    });

    it("should revert if reward amount per respondent is too small", async () => {
        const { ethers } = await network.connect();
        const schemaSmallReward: SurveySchema = {
            title: "제목",
            description: "설명",
            targetNumber: 1000,
            questions: [{ question: "Q1", options: ["A", "B", "C"] }],
        };
        await expect(
            factory.createSurvey(
                schemaSmallReward,
                { value: ethers.parseEther("50") }
            )
        ).to.be.revertedWith("Insufficient reward amount");
    });

    it("should store created surveys and return them from getSurveys", async () => {
        const { ethers } = await network.connect();

        const schema1: SurveySchema = {
            title: "제목",
            description: "설명",
            targetNumber: 100,
            questions: [{ question: "Q1", options: ["A", "B", "C"] }],
        };
        await expect(
            factory.createSurvey(
                schema1,
                { value: ethers.parseEther("100") }
            )
        ).to.emit(factory, "SurveyCreated");

        const schema2: SurveySchema = {
            title: "제목",
            description: "설명",
            targetNumber: 200,
            questions: [{ question: "Q1", options: ["A", "B", "C"] }],
        };
        await expect(
            factory.createSurvey(
                schema2,
                { value: ethers.parseEther("100") }
            )
        ).to.emit(factory, "SurveyCreated");

        const surveys = await factory.getSurveys();
        expect(surveys.length).to.be.greaterThanOrEqual(2);
        expect(surveys[0]).to.not.equal(surveys[1]);
    });
});


