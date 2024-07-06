const express=require("express");
const bodyParser=require("body-parser");
const app=express();
const mongoose=require("mongoose");
const _=require("lodash");
mongoose.connect("mongodb://localhost:27017/todolist");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("views"));
// app.use(express.static("about"));
app.set('view engine', 'ejs');

const itemsSchema={
    name:String
    };

const listSchema={
    name:String,
    items:[itemsSchema]
};
const List=mongoose.model("List",listSchema);
const Item=mongoose.model("Item",itemsSchema);
const item1=new Item({
    name:"Welcome to your todo list"
});
const item2=new Item({
    name:"Hit the + to add a new item to the list"
});
const defaultItems=[item1,item2];
let today=new Date();
    let options={
        weekday:"long",
        day:"numeric",
        month:"long"
    };
let day=today.toLocaleDateString("en-US",options);

async function save(){
    try{
        await Item.insertMany(defaultItems);
        console.log("successfully saved default items in db");
    }
    catch(error){
        console.log(error);
    }
}

app.get("/",function(req,res){
    
    async function getItems(){
        try{
            const items=await Item.find({});
            if(items.length===0){
                save();
            }
            res.render("list",{kindOfDay:day,newItems:items});
        }
        catch(error){
            console.log(error);
        }
    }
    getItems();
    
});
app.post("/delete",function(req,res){
    const checkedItemId=req.body.checkbox;
    const listName=req.body.listName;
    async function deleteItem(){
        try{
            await Item.findByIdAndDelete(checkedItemId);
            console.log("Successfully deleted checked item")
            res.redirect("/");
        }
        catch(error){
            console.log(error);
        }
    }
    async function findNdUpdate(){
        try{
            await List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}});
            res.redirect("/"+listName);
        }
        catch(error){
            console.log(error);
        }
    }
    if(listName===day){
        deleteItem();
    }
    else{
        findNdUpdate();
    }

});
app.post("/",function(req,res){
    const listName=req.body.list;
    let itemName=req.body.newItem;
    const item=new Item({
        name:itemName
    });
    if(listName===day){ 
        item.save();
        res.redirect("/");
    }
    else{
        async function findList(){
            try{
                found=await List.findOne({name:customListName});
                found.items.push(item);
                found.save();
                res.redirect("/"+listName);
            }
            catch(error){
                console.log(error);
            }
        }
        findList();
    }
});

app.get("/:customListName",function(req,res){
    customListName=req.params.customListName;
    async function findList(){
        try{
            found=await List.findOne({name:customListName});
            if(!found){
                const list=new List({
                    name:customListName,
                    items:defaultItems
                });
                list.save();
                res.redirect("/"+customListName);
            }
            else{
                res.render("list",{kindOfDay:found.name,newItems:found.items});
            }
        }
        catch(error){
            console.log(error);
        }
    }
    findList();
    
});

app.listen(process.env.PORT||3000,function(){
    console.log("server is up and running");
});