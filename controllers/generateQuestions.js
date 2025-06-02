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

    const { duration, interviewType, email, jobId, amount } = req.body;

    // Validate required fields
    if (!email || !duration || !interviewType || !jobId || !amount) {
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
- Toatl Interview Questions to generate : ${amount}

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

    const { email, duration, interviewType, jobId, questionList, interviewId, amount } = req.body
    if (!email || !duration || !interviewType || !jobId || !questionList || !interviewId || !amount) {
        return next(new Errorhandler("fill the details", 300));
    }

    const interview = await interviewModel.create({ email, duration, interviewType, jobId, questionList, amount, interviewId });
    if (!interview) {
        return next(new Errorhandler("failed to create interview", 300));
    }
    res.status(201).json({
        success: true,
        message: "interview created successful"
    })

})


const parseFeedback = (data) => {
    // 1. First ensure we have a string
    if (typeof data !== 'string') {
        console.error('Expected string data but got:', typeof data);
        return null;
    }

    // 2. Clean the string to handle common AI response issues
    const cleanedData = data
        .replace(/```json/g, '')  // Remove Markdown code block markers
        .replace(/```/g, '')      // Remove any remaining backticks
        .trim();                  // Trim whitespace

    // 3. Attempt JSON parsing with error handling
    try {
        const feedbackObj = JSON.parse(cleanedData);

        // 4. Validate the basic structure
        if (!feedbackObj?.feedback) {
            throw new Error('Invalid feedback structure - missing "feedback" property');
        }

        return feedbackObj;

    } catch (error) {
        console.error('Failed to parse feedback:', error);
        console.debug('Original content:', data);

        // 5. Fallback: Try to extract JSON from malformed response
        try {
            const jsonMatch = data.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (fallbackError) {
            console.error('Fallback parsing also failed:', fallbackError);
        }

        return null;
    }
};


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

    const { conversation, userName, userEmail, interviewId, interviewType, jobPosition } = req.body;
    console.log(conversation);

    if (!conversation) {
        return next(new Errorhandler("conversation not found", 300))
    }
    if (!userName || !userEmail || !interviewId) {
        return next(new Errorhandler("details are incomplete", 300))
    }
    console.log(conversation);
    const FEEDBACK_PROMPT = `Generate comprehensive interview feedback in JSON format based on the following candidate evaluation. Follow these guidelines strictly:

1. STRUCTURE:
{
  "feedback": {
    "ratings": {
      "technical": 0-10,  // Technical competency for role
      "problemSolving": 0-10,  // Approach to challenges
      "communication": 0-10,  // Clarity and articulation
      "experience": 0-10,  // Alignment with company values
    },
    "verdict": "hire/no-hire/strong hire",
    "highlights": {
      "strengths": ["array", "of", "3-4", "key strengths"],
      "concerns": ["array", "of", "2-3", "improvement areas"]
    },
    "detailedAnalysis": {
      "technical": "paragraph with specific examples",
      "problemSolving": "paragraph with specific examples", 
      "communication": "paragraph with specific examples",
      "experience": "paragraph with specific examples"
    },
    "recommendations": {
      "roleSuitability": "specific position if different",
      "onboardingFocus": ["key", "areas", "for", "ramp-up"],
      "growthPotential": "1-2 sentences on trajectory"
    },
    "summary":"based on over all interview"
  }
}

2. RATING SCALE:
10 = World-class, 9 = Exceptional, 8 = Strong, 7 = Good, 6 = Satisfactory, 
5 = Needs improvement, 4 = Significant gaps, 3 = Poor

3. INPUT CONTEXT:
- Candidate Name:${userName}
- Position:${jobPosition}
- Interview Type: ${interviewType}
- Interview Transcript :${conversation}
4. REQUIREMENTS:
- Be brutally honest but professional
- Cite specific examples from interview
- Differentiate between hard skills and potential
- Flag any red flags clearly
- Suggest alternative roles if mismatched
- Use concise, actionable language
- Maintain consistent rating logic

5. OUTPUT NOTES:
- Omit null/empty fields
- Escape special characters
- Ensure valid JSON`

    let FINAL_PROMPT = FEEDBACK_PROMPT
    const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.API_REF_KEY,
        timeout: 30000 // 30 seconds timeout
    });
    //deepseek/deepseek-prover-v2:free
    // google/gemini-2.5-flash-preview-05-20
    // google/gemma-3n-e4b-it:free
    const completion = await openai.chat.completions.create({
        model: "google/gemini-2.5-flash-preview-05-20",
        messages: [
            { role: "user", content: FINAL_PROMPT }
        ],
        temperature: 0.7,
    });

    // Safely try to parse the JSON string into an object
    let data = completion?.choices?.[0]?.message?.content;
    console.log('Raw API response:', typeof data, data);

    let feedbackObj = parseFeedback(data);
    console.log('Parsed feedback object:', feedbackObj);

    const feedback = feedbackObj.feedback;
    const { technical, problemSolving, communication, experience } = feedback.ratings;
    const verdict = feedback.verdict;
    const summary = feedback.summary;
    console.log(technical)
    console.log(problemSolving)
    console.log(communication)
    console.log(experience)

    const feedbacks = await feedBackModel.create({
        userName,
        userEmail,
        interview_id: interviewId,
        rating: {
            technicalSkills: technical,
            communication: communication,
            problemSolving: problemSolving,
            experience: experience,
        },
        considered: verdict,
        summary
    });
    res.status(200).json({
        success: true,
        message: "feedback provided!!",
        feedbackData: feedbacks,
    });
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
    const lenOfFeed = feedbacksAll.length
    res.status(200).json({
        success: true,
        message: "success",
        feedbacksAll,
        lenOfFeed
    })
})

export const getFeedback = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    const { role } = req.user;

    if (role === "JobSeeker") {
        return next(new Errorhandler(`${role} can,t access this source`, 300))
    }

    const feed = await feedBackModel.findById({ interview_id: id });
    console.log(feed)

    if (!feed) {
        return next(new Errorhandler("error at database fetch", 400))
    }
    res.status(200).json({
        success: true,
        message: "done fetching",
        feed
    })
})

