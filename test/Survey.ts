import { expect } from "chai";
import { network } from "hardhat";

interface Question {
    question: string;
    options: string[];
}

it("Survey init", async () => {
    const { ethers } = await network.connect();

    const title = "막무가내 설문조사";
    const description = "중앙화된 설문조사로서, 모든 데이터는 공개되지 않으며 설문조사를 게시한자만 볼 수 있습니다.";
    const questions: Question[] = [
        {
          question: "누가 내 응답을 관리할 때 더 솔직할 수 있을까요?",
          options: ["구글폼 운영자", "탈중앙화된 블록체인", "상관없음",],
        },
    ];

    const factory = await ethers.deployContract("SurveyFactory", [
        ethers.parseEther("50"),
        ethers.parseEther("0.1"),
    ]);
    const tx = await factory.createSurvey({
        title, 
        description, 
        targetNumber: 100,
        questions
    }, {
        value: ethers.parseEther("100"),
    });

    const receipt = await tx.wait();
    let surveyAddress;
    receipt?.logs.forEach(log => {
        const event = factory.interface.parseLog(log);
        if(event?.name == "SurveyCreated") {
            surveyAddress = event.args[0];
        }

    });
    // const surveys = await factory.getSurveys();
    
    const surveyC = await ethers.getContractFactory("Survey");
    const signers = await ethers.getSigners();
    const respondent = signers[0];
    if (surveyAddress) {
        const survey = await surveyC.attach(surveyAddress);
        await survey.connect(respondent);
        console.log(ethers.formatEther(await ethers.provider.getBalance(respondent)));
        const submitTx = await survey.submitAnswer({
            respondent,
            answers: [1],
        });
        await submitTx.wait();
        console.log(ethers.formatEther(await ethers.provider.getBalance(respondent)));
    }



    // const s = await ethers.deployContract("Survey", [title, description, questions]);
    // const _title = await s.title();
    // const _desc = await s.description();
    // const _questions = (await s.getQuestions()) as Question[]; 
    // expect(_title).eq(title);
    // expect(_desc).eq(description);
    // expect(_questions[0].options).deep.eq(questions[0].options);

    // const signers = await ethers.getSigners();
    // const respondent = signers[1];
    // await s.connect(respondent);
    // s.submitAnswer({
    //     respondent:respondent.address,
    //     answers: [1],
    // });

    // console.log(await s.getAnswers());
    // // console.log(await s.title());
    // // console.log(await s.description());
    // // console.log(await s.getQuestions());    
});