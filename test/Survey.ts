import { expect } from "chai";
import { network } from "hardhat";

interface Question {
    question: string;
    options: string[];
}

it("Survey init", async () => {
    const { ethers } = await network.connect();

    const title = "";
    const description = "";
    const questions: Question[] = [
        {
          question: "",
          options: [""],
        },
    ];
    const s = await ethers.deployContract("Survey", [title, description, questions]);
    const _title = await s.title();
    const _desc = await s.description();
    const _questions = (await s.getQuestions()) as Question[]; 
    expect(_title).eq(title);
    expect(_desc).eq(description);
    expect(_questions[0].options).deep.eq(questions[0].options);
    
    // console.log(await s.title());
    // console.log(await s.description());
    // console.log(await s.getQuestions());    
});