import express from "express";
import Thread from "../models/Thread.js";
import getOpenAIAPIResponse from "../utils/gemini.js";

const router = express.Router();

//test
router.post("/test", async(req,res) => {
    try{
        const thread = new Thread({
            threadId: "abc",
            title: "Testing New Thread"
        });

        const response = await thread.save();
        res.send(response);
    }catch(err){
        console.log(err);
        res.status(500).json({error: "failed to save in DB"});
    }
});

//Get all thread
router.get("/thread", async(req,res) => {
    try{
        const threads = await Thread.find({}).sort({updatedAt: -1});
        //descending order of updatedAt...most recent data on top
        res.json(threads);
    }catch(err){
        console.log(err);
        res.status(500).json({error: "failed to fetch threads"});
    }
});

router.get("/thread/:threadId", async(req,res) => {
    const {threadId} = req.params;

    try{
        const thread = await Thread.findOne({threadId});
        
        if(!thread){
            res.status(404).json({srror: "Thread not found"});
        }
        res.json(thread.messages);
    }catch(err){
        console.log(err);
        res.status(500).json({error: "failed to fetch chat"});
    }
});

router.delete("/thread/:threadId", async(req,res) => {
    const {threadId} = req.params;

    try{
        const deletedThread = await Thread.findOneAndDelete({threadId});
        
        if(!deletedThread){
            res.status(404).json({srror: "Thread not found"});
        }
        res.status(200).json({success: "Thread deleted successfully"});
    }catch(err){
        console.log(err);
        res.status(500).json({error: "failed to delete thread"});
    }
});

router.post("/chat", async(req,res) => {
    const {threadId,message} = req.body;

    if(!threadId || !message){
        res.status(400).json({error: "missing required field"});
    }

    try{
       let thread = await Thread.findOne({threadId});

       if(!thread){
            //create new thread in db
            thread = new Thread({
                threadId,
                title: message,
                messages: [{role: "user", content: message}]
            });
       }else{
            thread.messages.push({role: "user", content: message});
       }
       
       const assistantReply = await getOpenAIAPIResponse(message);

       thread.messages.push({role: "assistant", content: assistantReply});
       thread.updatedAt = new Date();
       await thread.save();
       res.json({reply: assistantReply});

    }catch(err){
        console.log(err);
        res.status(500).json({error: "something went wrong"});
    }
});

export default router;

