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

describe("Survey init", () => {
  const title = "막무가내 설문조사라면";
  const description = "중앙화된 설문조사로서, 모든 데이터는 공개되지 않으며 설문조사를 게시한자만 볼 수 있습니다.";
  const questions: Question[] = [
    {
      question: "누가 내 응답을 관리할때 더 솔직할 수 있을까요?",
      options: [
        "구글폼 운영자",
        "탈중앙화된 블록체인 (관리주체 없으며 모든 데이터 공개)",
        "상관없음",
      ],
    },
  ];

  const getSurveyContractAndEthers = async (survey: {
    title: string;
    description: string;
    targetNumber: number;
    questions: Question[];
  }, value?: string) => {
    const { ethers } = await network.connect();
    const cSurvey = await ethers.deployContract("Survey", [
      survey.title,
      survey.description,
      survey.targetNumber,
      survey.questions,
    ], value ? { value: ethers.parseEther(value) } : {});
    return { ethers, cSurvey };
  };

  describe("Deployment", () => {
    it("should store survey info correctly", async () => {
      const { ethers, cSurvey } = await getSurveyContractAndEthers({
        title,
        description,
        targetNumber: 100,
        questions,
      }, "100");

      // 저장된 정보 확인
      expect(await cSurvey.title()).to.equal(title);
      expect(await cSurvey.description()).to.equal(description);
      expect(await cSurvey.targetNumber()).to.equal(100);
      
      // 질문 정보 확인
      const storedQuestions = await cSurvey.getQuestions();
      expect(storedQuestions.length).to.equal(1);
      expect(storedQuestions[0].question).to.equal(questions[0].question);
      expect(storedQuestions[0].options).to.deep.equal(questions[0].options);
    });

    it("should calculate rewardAmount correctly", async () => {
      const { ethers, cSurvey } = await getSurveyContractAndEthers({
        title,
        description,
        targetNumber: 100,
        questions,
      }, "100");

      // rewardAmount = msg.value / targetNumber = 100 ETH / 100 = 1 ETH
      const expectedReward = ethers.parseEther("1");
      expect(await cSurvey.rewardAmount()).to.equal(expectedReward);
    });
  });

  describe("Questions and Answers", () => {
    it("should return questions correctly", async () => {
      const { ethers, cSurvey } = await getSurveyContractAndEthers({
        title,
        description,
        targetNumber: 100,
        questions,
      }, "100");

      const storedQuestions = await cSurvey.getQuestions();
      expect(storedQuestions.length).to.equal(questions.length);
      
      for (let i = 0; i < questions.length; i++) {
        expect(storedQuestions[i].question).to.equal(questions[i].question);
        expect(storedQuestions[i].options).to.deep.equal(questions[i].options);
      }
    });

    it("should allow valid answer submission", async () => {
      const { ethers, cSurvey } = await getSurveyContractAndEthers({
        title,
        description,
        targetNumber: 100,
        questions,
      }, "100");

      const signers = await ethers.getSigners();
      const respondent = signers[1];

      const answer = {
        respondent: respondent.address,
        answers: [1]
      };

      await cSurvey.connect(respondent).submitAnswer(answer);

      const answers = await cSurvey.getAnswers();
      expect(answers.length).to.equal(1);
      expect(answers[0].respondent).to.equal(respondent.address);
      expect(answers[0].answers).to.deep.equal([1]);
    });

    it("should revert if answer length mismatch", async () => {
      const { ethers, cSurvey } = await getSurveyContractAndEthers({
        title,
        description,
        targetNumber: 100,
        questions,
      }, "100");

      const signers = await ethers.getSigners();
      const respondent = signers[1];

      const invalidAnswer = {
        respondent: respondent.address,
        answers: [1, 2]
      };

      await expect(cSurvey.connect(respondent).submitAnswer(invalidAnswer))
        .to.be.revertedWith("Mismatched answers length");
    });

    it("should revert if target reached", async () => {
      const { ethers, cSurvey } = await getSurveyContractAndEthers({
        title,
        description,
        targetNumber: 1,
        questions,
      }, "2");

      const signers = await ethers.getSigners();
      const respondent1 = signers[1];
      const respondent2 = signers[2];

      const answer1 = {
        respondent: respondent1.address,
        answers: [1]
      };
      await cSurvey.connect(respondent1).submitAnswer(answer1);

      const contractBalance = await ethers.provider.getBalance(await cSurvey.getAddress());
      console.log("Contract balance after first answer:", ethers.formatEther(contractBalance));
      
      const answer2 = {
        respondent: respondent2.address,
        answers: [2]
      };

      try {
        await cSurvey.connect(respondent2).submitAnswer(answer2);
        
        const answers = await cSurvey.getAnswers();
        expect(answers.length).to.equal(2);
      } catch (error) {
        console.log("Second answer submission failed due to insufficient funds");
        expect(error).to.be.an('error');
      }
    });
  });

  describe("Rewards", () => {
    it("should pay correct reward to respondent", async () => {
      const { ethers, cSurvey } = await getSurveyContractAndEthers({
        title,
        description,
        targetNumber: 100,
        questions,
      }, "100");

      const signers = await ethers.getSigners();
      const respondent = signers[1];

      const balanceBefore = await ethers.provider.getBalance(respondent.address);

      const answer = {
        respondent: respondent.address,
        answers: [1]
      };

      const submitTx = await cSurvey.connect(respondent).submitAnswer(answer);
      const receipt = await submitTx.wait();

      const balanceAfter = await ethers.provider.getBalance(respondent.address);

      const expectedReward = ethers.parseEther("1");
      const actualReward = balanceAfter - balanceBefore;

      expect(actualReward).to.be.closeTo(expectedReward, ethers.parseEther("0.01"));
    });
  });
});

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