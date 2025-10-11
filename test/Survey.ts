import { expect } from "chai";
import { keccak256 } from "ethers";
import { network } from "hardhat";

interface Question {
    question: string;
    options: string[];
}

// it("Survey init", async () => {
//     const { ethers } = await network.connect();

//     const title = "막무가내 설문조사";
//     const description = "중앙화된 설문조사로서, 모든 데이터는 공개되지 않으며 설문조사를 게시한자만 볼 수 있습니다.";
//     const questions: Question[] = [
//         {
//           question: "누가 내 응답을 관리할 때 더 솔직할 수 있을까요?",
//           options: ["구글폼 운영자", "탈중앙화된 블록체인", "상관없음",],
//         },
//     ];

//     const factory = await ethers.deployContract("SurveyFactory", [
//         ethers.parseEther("50"),
//         ethers.parseEther("0.1"),
//     ]);
//     const tx = await factory.createSurvey({
//         title, 
//         description, 
//         targetNumber: 100,
//         questions
//     }, {
//         value: ethers.parseEther("100"),
//     });

//     const receipt = await tx.wait();
//     let surveyAddress;
//     receipt?.logs.forEach(log => {
//         const event = factory.interface.parseLog(log);
//         if(event?.name == "SurveyCreated") {
//             surveyAddress = event.args[0];
//         }

//     });
//     // const surveys = await factory.getSurveys();
    
//     const surveyC = await ethers.getContractFactory("Survey");
//     const signers = await ethers.getSigners();
//     const respondent = signers[0];
//     if (surveyAddress) {
//         const survey = await surveyC.attach(surveyAddress);
//         await survey.connect(respondent);
//         console.log(ethers.formatEther(await ethers.provider.getBalance(respondent)));
//         const submitTx = await survey.submitAnswer({
//             respondent,
//             answers: [1],
//         });
//         await submitTx.wait();
//         console.log(ethers.formatEther(await ethers.provider.getBalance(respondent)));
//     }



//     // const s = await ethers.deployContract("Survey", [title, description, questions]);
//     // const _title = await s.title();
//     // const _desc = await s.description();
//     // const _questions = (await s.getQuestions()) as Question[]; 
//     // expect(_title).eq(title);
//     // expect(_desc).eq(description);
//     // expect(_questions[0].options).deep.eq(questions[0].options);

//     // const signers = await ethers.getSigners();
//     // const respondent = signers[1];
//     // await s.connect(respondent);
//     // s.submitAnswer({
//     //     respondent:respondent.address,
//     //     answers: [1],
//     // });

//     // console.log(await s.getAnswers());
//     // // console.log(await s.title());
//     // // console.log(await s.description());
//     // // console.log(await s.getQuestions());    
// });


it("Survey storage layout", async () => {
    const { ethers } = await network.connect();

    const title = "막무가내 설문조사";
    const description = "중앙화된 설문조사로서, 모든 데이터는 공개되지 않으며 설문조사를 게시한자만 볼 수 있습니다.";
    const questions: Question[] = [
        {
          question: "누가 내 응답을 관리할 때 더 솔직할 수 있을까요?",
          options: ["구글폼 운영자", "탈중앙화된 블록체인", "상관없음",],
        },
        {
          question: "test2",
          options: ["구글폼 운영자"],
        },
    ];

    const survey = await ethers.deployContract("Survey", [
        title, 
        description, 
        100,
        questions
        ], 
    {
        value: ethers.parseEther("100"),
    });

    // title은 길이가 일어서 primitve타입으로 슬롯에 저장, description은 32bytes 넘어서 dynamic(참조)타입으로 저장

    const slot0Data = await ethers.provider.getStorage(survey.getAddress(), ethers.toBeHex(0, 32));
    const slot1Data = await ethers.provider.getStorage(survey.getAddress(), ethers.toBeHex(1, 32));
    const slot2Data = await ethers.provider.getStorage(survey.getAddress(), ethers.toBeHex(2, 32));
    const slot3Data = await ethers.provider.getStorage(survey.getAddress(), ethers.toBeHex(3, 32));
    const slot4Data = await ethers.provider.getStorage(survey.getAddress(), ethers.toBeHex(4, 32));
    const slot5Data = await ethers.provider.getStorage(survey.getAddress(), ethers.toBeHex(5, 32));
    const slot6Data = await ethers.provider.getStorage(survey.getAddress(), ethers.toBeHex(6, 32)); 


    const decodeUni = (hex: string) => Buffer.from(hex.slice(2), "hex").toString("utf-8");

    const nextHash = (hex:string, i:number) => "0x" + (BigInt(hex) + BigInt(i)).toString(16);

    
    // primitive type
    console.log("primitive types")
    console.log(slot2Data);
    console.log(slot3Data);
    
    // long string type
    console.log("long string types")
    console.log(slot1Data) // 0x103 ==259, 129
    // 259 = 129*2 +1 (+1: long string type)
    const pDesc = keccak256(ethers.toBeHex(1, 32))
    const desc0 = await ethers.provider.getStorage(await survey.getAddress(), nextHash(pDesc, 0));
    const desc1 = await ethers.provider.getStorage(await survey.getAddress(), nextHash(pDesc, 1));
    const desc2 = await ethers.provider.getStorage(await survey.getAddress(), nextHash(pDesc, 2));
    const desc3 = await ethers.provider.getStorage(await survey.getAddress(), nextHash(pDesc, 3));
    const desc4 = await ethers.provider.getStorage(await survey.getAddress(), nextHash(pDesc, 4));
    const desc5 = await ethers.provider.getStorage(await survey.getAddress(), nextHash(pDesc, 5));

    console.log(desc0);
    console.log(desc1);
    console.log(desc2);
    console.log(desc3);
    console.log(desc4);
    console.log(desc5); 


    // array type
    // pQuestions : 0x8a35acfbc15ff81a39ae7d344fd709f28e8600b4aa8c65c6b64bfe7fe36bd19b
    // pQuestions +1: 0x8a35acfbc15ff81a39ae7d344fd709f28e8600b4aa8c65c6b64bfe7fe36bd19c
    // question1          <-- pQuestions
    // question1_option[] <--pQuestions + 1
    // question2          <-- pQuestions + 2
    // question2_option[] <-- pQuestions + 3

    console.log("---array & struct type ---")
    console.log("slot4Data", slot4Data); // questions array length
    const pQuestions = keccak256(ethers.toBeHex(4, 32)); // key, questions array의 첫 번째 요소

    const question1 = await ethers.provider.getStorage(survey.getAddress(), nextHash(pQuestions, 0));
    const question1_option_array = await ethers.provider.getStorage(survey.getAddress(), nextHash(pQuestions, 1));
    const question2 = await ethers.provider.getStorage(survey.getAddress(), nextHash(pQuestions, 2));
    const question2_option_array = await ethers.provider.getStorage(survey.getAddress(), nextHash(pQuestions, 3));

    console.log("question1", question1);
    console.log("question1_option_array", question1_option_array);
    console.log("question2", question2, decodeUni(question2));
    console.log("question2_option_array", question2_option_array);
    

    // map 자체가 키값
    // map[keccak256(k, slot address)]
    console.log(slot6Data);
    const addr = "0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199";
    const mapKeyAddr = keccak256(ethers.toBeHex(addr, 32) + ethers.toBeHex(6, 32).slice(2));
    const map1Value = await ethers.provider.getStorage(survey.getAddress(), mapKeyAddr);
    console.log(map1Value);
;
});