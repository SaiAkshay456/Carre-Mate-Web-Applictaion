// import jobModel from "../models/jobSchema.js";
// import { catchAsyncError } from "../middleware/catchAsyncError.js";
// import { Errorhandler } from "../middleware/error.js";
// import OpenAI from "openai"


// export const generateQuestions = catchAsyncError(async (req, res, next) => {
//     const { role } = req.user;

//     if (role === "JobSeeker") {
//         return next(new Errorhandler(`${role} cannot access source`, 400));
//     }
//     const { duration, interviewType, email, jobId } = req.body;
//     console.log(req.body);

//     if (!email || !duration || !interviewType || !jobId) {
//         return next(new Errorhandler("fill the details", 300))
//     }

//     const job = await jobModel.findById(jobId);
//     if (!job) {
//         return next(new Errorhandler("no job found", 300))
//     }

//     let jobDescription = job.description;
//     let jobTitle = job.title;

//     let PROMPT = `You are an expert technical interviewer.

// Generate a set of structured interview questions based on the following candidate and job details:

// - Job Title: {{position}}
// - Job Description: {{jobDescription}}
// - Interview Types: {{interviewTypes}} (e.g., Technical, Behavioral, Problem Solving,Experience)
// - Total Interview Duration: {{duration}} minutes

// Please return the questions as a JSON array in the following format:

// [
//   { "question": "Question text here","answer": ""},
//   ...
// ]

// Each question should be concise, relevant to the job role and interview type, and suitable for the candidate's experience level. Distribute questions proportionally across the selected interview types.

// Do not include any explanations or extra text — only the JSON array.
// `
//     const filledPrompt = PROMPT
//         .replace('{{position}}', jobTitle)
//         .replace('{{jobDescription}}', jobDescription)
//         .replace('{{interviewTypes}}', interviewType)
//         .replace('{{duration}}', duration);
//     const openai = new OpenAI({
//         baseURL: "https://openrouter.ai/api/v1",
//         apiKey: process.env.API_REF_KEY,
//     })
//     const completion = await openai.chat.completions.create({
//         // model: "deepseek/deepseek-prover-v2:free",
//         // model: "qwen/qwen3-30b-a3b:free",
//         model: "deepseek/deepseek-prover-v2:free",
//         messages: [
//             { role: "user", content: filledPrompt }
//         ],
//     })
//     if (!completion.choices[0].message) {
//         return next(new Errorhandler("todays limit up", 300));
//     }
//     let finalQuestions = completion.choices[0].message;
//     console.log(completion);
//     res.status(200).json({
//         success: true,
//         message: "questions generated!!",
//         finalQuestions
//     })


// })

import jobModel from "../models/jobSchema.js";
import { catchAsyncError } from "../middleware/catchAsyncError.js";
import { Errorhandler } from "../middleware/error.js";
import OpenAI from "openai";
import interviewModel from "../models/interviewSchema.model.js";
import feedBackModel from "../models/feedbackInterviewSchema.js";
import User from "../models/user.js";

export const generateQuestions = catchAsyncError(async (req, res, next) => {
    const { role } = req.user;

    if (role === "JobSeeker") {
        return next(new Errorhandler(`${role} cannot access this resource`, 403));
    }

    const { duration, interviewType, email, jobId } = req.body;

    // Validate required fields
    if (!email || !duration || !interviewType || !jobId) {
        return next(new Errorhandler("Please fill all required details", 400));
    }

    // Validate duration is a number
    if (isNaN(duration) || duration <= 0) {
        return next(new Errorhandler("Duration must be a positive number", 400));
    }

    try {
        const job = await jobModel.findById(jobId);
        if (!job) {
            return next(new Errorhandler("No job found with this ID", 404));
        }

        const jobDescription = job.description;
        const jobTitle = job.title;

        // Validate job description and title
        if (!jobDescription || !jobTitle) {
            return next(new Errorhandler("Job information is incomplete", 400));
        }

        const PROMPT = `You are an expert technical interviewer.

Generate a set of structured interview questions based on the following candidate and job details:

- Job Title: ${jobTitle}
- Job Description: ${jobDescription}
- Interview Types: ${interviewType}
- Total Interview Duration: ${duration} minutes

Please return the questions as a JSON array in the following format:

[
  { "question": "Question text here", "answer": "" },
  ...
]

Each question should be:
1. Concise and clear
2. Relevant to the job role
3. Appropriate for the interview type
4. Suitable for the specified duration

Distribute questions proportionally across the selected interview types. 
Return only the JSON array without any additional text or explanations.`;

        const openai = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: process.env.API_REF_KEY,
            timeout: 30000 // 30 seconds timeout
        });

        const completion = await openai.chat.completions.create({
            model: "deepseek/deepseek-prover-v2:free",
            messages: [
                { role: "user", content: PROMPT }
            ],
            temperature: 0.7,
        });

        // Validate OpenAI response
        if (!completion.choices?.[0]?.message?.content) {
            console.error('Invalid OpenAI response:', completion);
            return next(new Errorhandler("Today,s Request Limit is exceeded", 500));
        }
        let responseContent = completion.choices[0].message.content;
        // Clean and parse the response
        try {
            // Remove any markdown code block formatting
            const cleanedContent = responseContent.replace(/```json|```/g, '').trim();

            // Parse the JSON
            const questions = JSON.parse(cleanedContent);

            // Validate the questions array
            if (!Array.isArray(questions)) {
                throw new Error("Questions is not an array");
            }

            if (questions.length === 0) {
                throw new Error("Empty questions array");
            }

            // Validate each question
            questions.forEach((q, i) => {
                if (!q.question || typeof q.question !== 'string') {
                    throw new Error(`Invalid question at index ${i}`);
                }
            });

            return res.status(200).json({
                success: true,
                message: "Questions generated successfully",
                finalQuestions: {
                    content: JSON.stringify(questions),
                    count: questions.length
                }
            });

        } catch (parseError) {
            console.error('Error parsing questions:', parseError);
            console.error('Original response:', responseContent);
            return next(new Errorhandler("Failed to process generated questions. Please try again.", 500));
        }

    } catch (error) {
        console.error('Error in generateQuestions:', error);
        return next(new Errorhandler(error.message || "Internal server error", 500));
    }
});


export const postInterview = catchAsyncError(async (req, res, next) => {
    const { role } = req.user;
    if (role === "JobSeeker") {
        return next(new Errorhandler(`${role} can,t access source`, 300))
    }

    const { email, duration, interviewType, jobId, questionList, interviewId } = req.body
    if (!email || !duration || !interviewType || !jobId || !questionList || !interviewId) {
        return next(new Errorhandler("fill the details", 300));
    }

    const interview = await interviewModel.create({ email, duration, interviewType, jobId, questionList, interviewId });
    if (!interview) {
        return next(new Errorhandler("failed to create interview", 300));
    }
    res.status(201).json({
        success: true,
        message: "interview created successful"
    })

})



export const getInterviewDetails = catchAsyncError(async (req, res, next) => {

    const { id } = req.params;
    const interviewDetails = await interviewModel.findOne({ interviewId: id });

    if (!interviewDetails) {
        return next(new Errorhandler("error at inteview details", 300));
    }

    const jobid = interviewDetails.jobId;
    const jobs = await jobModel.findById({ _id: jobid });
    let jobTitle = jobs.title;
    res.status(200).json({
        success: true,
        message: "successfully fetched details",
        interviewDetails,
        jobTitle
    })

})


export const generateInterviewFeedback = catchAsyncError(async (req, res, next) => {

    const { conversation, userName, userEmail, interview_id } = req.body;
    console.log(conversation);

    if (!conversation) {
        return next(new Errorhandler("conversation not found", 300))
    }
    if (!userName || !userEmail || !interview_id) {
        return next(new Errorhandler("details are incomplete", 300))
    }

    const FEEDBACK_PROMPT = `here is the conversation :${conversation}

Analyze the following interview conversation between an AI interviewer (role: assistant) and a candidate (role: user). Based on the candidate's answers to the interviewer's questions, evaluate and give a score out of 10 in the following four areas:

Technical Skills (knowledge and correctness of technical content)

Communication (clarity and articulation)

Problem-Solving (how well they approach or attempt answering questions)

Behavioral (professionalism, enthusiasm, attitude)

Finally, provide a brief summary paragraph explaining the candidate's overall performance.
give output in JSON format below:

for example:
like below 
{

    feedback:{

        rating:{

            techicalSkills:5,

            communication:6,

            problemSolving:4,

            experince:7

        },

        summery:<in 3 Line>,
        Recommendation:'', provide boolean hire or not

        RecommendationMsg:''

    }

}

`
    let FINAL_PROMPT = FEEDBACK_PROMPT


    const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.API_REF_KEY,
        timeout: 30000 // 30 seconds timeout
    });

    const completion = await openai.chat.completions.create({
        model: "qwen/qwen3-4b:free",
        messages: [
            { role: "user", content: FINAL_PROMPT }
        ],
        temperature: 0.7,
    });

    let data = completion?.choices?.[0]?.message?.content;

    // Safely try to parse the JSON string into an object
    let feedbackObj;

    try {
        feedbackObj = JSON.parse(data);
        console.log("Parsed object:", feedbackObj);
        // Now you can process feedbackObj like a normal object
        console.log("Technical Skills Score:", feedbackObj.feedback.rating.technicalSkills);
    } catch (error) {
        console.error("Failed to parse data:", error);
    }

    let rating = feedbackObj?.feedback?.rating;
    let summary = feedbackObj?.feedback?.summary;
    let Recommendation = feedbackObj?.feedback?.Recommendation;
    console.log(rating.communication)
    console.log(rating.experience)
    console.log(rating.problemSolving)
    console.log(rating.technicalSkills)
    console.log(summary)
    console.log(Recommendation)
    let considered = Recommendation
    const feedbacks = await feedBackModel.create({
        userName, userEmail, interview_id, feedback: rating, considered
    })
    console.log("356", feedbacks);
    if (!feedbacks) {
        return next(new Errorhandler("could,nt save into database", 400))
    }
    res.status(200).json({
        success: true,
        message: "feedback provided!!",
        feedbackData: feedbacks,
        summary
    })
})


export const getAllInterviews = catchAsyncError(async (req, res, next) => {
    const { role } = req.user;
    if (role === "JobSeeker") {
        return next(new Errorhandler(`${role} can,t access source`, 400))
    }

    const email = req.user.email;
    const user = await User.find({ email });

    const interviews = await interviewModel.find({ email })
        .populate("jobId", "title")
        .sort({ createdAt: -1 });
    console.log(interviews)
    if (!interviews) {
        return next(new Errorhandler("error fetching interview", 300));
    }
    res.status(200).json({
        success: true,
        message: "successfully fetched",
        interviews
    })

})

export const deleteInterview = catchAsyncError(async (req, res, next) => {
    const { role } = req.user;
    if (role === "JobSeeker") {
        return next(new Errorhandler(`${role} cannot access this resource`, 300))
    }

    const { interview_id } = req.params;

    let interview = await interviewModel.findOne({ interviewId: interview_id });
    if (!interview) {
        return next(new Errorhandler(`cannot find interview`, 300))
    }
    await interview.deleteOne();
    res.status(200).json({
        success: true,
        messaage: "successfully deleted"
    })
})


export const getAllInterviewFeedbacks = catchAsyncError(async (req, res, next) => {

    const { id } = req.params;

    const feedbacksAll = await feedBackModel.find({ interview_id: id });
    if (!feedbacksAll) {
        return next(new Errorhandler("error fetchin feedback", 302))
    }
    res.status(200).json({
        success: true,
        message: "success",
        feedbacksAll
    })
})

export const getFeedback = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    const { role } = req.user;

    if (role === "JobSeeker") {
        return next(new Errorhandler(`${role} can,t access this source`, 300))
    }

    const feed = await feedBackModel.findById(id);

    if (!feed) {
        return next(new Errorhandler("error at database fetch", 400))
    }
    res.status(200).json({
        success: true,
        message: "done fetching",
        feed
    })
})

