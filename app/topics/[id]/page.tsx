"use client";

import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TopicPage() {
    const { id } = useParams();
    const router = useRouter();

    const [notes, setNotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [text, setText] = useState("");
    const [topicName, setTopicName] = useState("");
    const [editingNote, setEditingNote] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState("");


    function getErrorMessage(data: any) {
        if (typeof data?.error === "string") return data.error;
        if (Array.isArray(data?.error)) {
            return data.error[0]?.message;
        }
        if (data?.details) {
            return data.details[0]?.message;
        }
        return "something wrong";
    }


    const handleDelete = async(id : string) => {
        if (!confirm("Delete this note?")) return;
        try {
            const { data : { session }} = await supabase.auth.getSession(); 
            const res = await fetch(`/api/notes/${id}`,{
                method : "DELETE",
                headers : {
                    Authorization: `Bearer ${session?.access_token}`
                }
            });

            const resData = await res.json();
            if(!resData){
                alert(getErrorMessage(resData));
            }
            setNotes((prev) => prev.filter((n) => n.id !==id ));

        } catch (err) {
            console.error(err);
        }
    }

    const handleEdit = (note:any) => {                          //edit note
        setEditingId(note.id);
        setEditingText(note.text);
    }

    
    const handleSubmit = async() => {

        const currentText = editingId ? editingText : text;

        if (!currentText.trim()) {
            alert("Note cannot be empty");
            return;
        }
        try{
            setSubmitting(true);
            const {
                data: { session },
            } = await supabase.auth.getSession();


            if(editingId){                                                       //update

                const original = notes.find(n => n.id === editingId);

                if(!original)return;

                if (currentText === original?.text) {
                    alert("No changes made");
                    return;
                }

                console.log("TEXT SENDING:", currentText);
                
                if(!editingId){
                    alert("invalid note id");
                    return;
                }                      
                
                let res : Response ;
                try {
                    res = await fetch(`/api/notes/${editingId}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${session?.access_token}`,
                        },
                        body: JSON.stringify({ text : currentText }),
                    });
                } catch (err) {
                    console.error("Fetch failed:", err);
                    alert("Network error");
                    return;
                }               

                if(!res){
                    alert("Request failed");
                    return;
                }

                let resData;
                try {
                    resData = await res.json();
                } catch (error) {
                    alert("Invalid server response");
                    return;
                }
               
                if (!res.ok) {
                    alert(getErrorMessage(resData));
                    return;
                }

                const updated = Array.isArray(resData) ? resData[0] : resData;
                
                if (!updated || !updated.id) {
                    alert("Invalid update response");
                    return;
                }

                setNotes((prev) => 
                    prev.map(n => 
                        n.id === editingId ? updated : n
                    )    
                );

                setEditingId(null);
                setEditingText("");

                await fetchTopicNotes();            //sync ui

            } else{                                                                          //Add
                const res = await fetch("/api/notes",{
                    method : "POST",
                    headers : {
                        "Content-Type" : "application/json",
                        Authorization: `Bearer ${session?.access_token}`
                    },
                    body : JSON.stringify({
                        text,
                        topicId : id
                    })
                })
                const data = await res.json();
                if(!res.ok){
                    alert(getErrorMessage(data));
                    return;
                }
                setNotes((prev) => [data,...prev])
            }
            setText("");
        }
        catch (err) {
            console.error(err);
        }
        finally{
            setSubmitting(false);
        }
    }
    


    async function fetchTopicNotes(){
        if (!id) return;
        setLoading(true);

        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            const res = await fetch(`/api/notes?topicId=${id}`, {
                headers: {
                    Authorization: `Bearer ${session?.access_token}`,
                },
            });
            const data = await res.json();

            if (!res.ok) {
                console.error("failed to fetch topic/notes");
                return;
            }

            setNotes(data);

        } catch (err) {
            console.error("Error fetching notes : ", err);
        }finally{
            setLoading(false);
        }
    }



    async function fetchTopicName() {
        try {
            const { data : { session }} = await supabase.auth.getSession();

            const res = await fetch(`/api/topics/${id}`, {
                headers : {
                    Authorization: `Bearer ${session?.access_token}`
                }
            })
            if(!res.ok){
                console.error("failed to fetch topic");
                return;
            }
            const data = await res.json();

            setTopicName(data.name);
            
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        if(id){
            fetchTopicNotes();
            fetchTopicName();
        }
    }, [id]);



    const togglePin = async(note : any) => {
        try {
        const { data : { session }} = await supabase.auth.getSession();

        console.log("TOGGLING PIN:", note);

        const res = await fetch(`/api/notes/${note.id}`, {
            method : "PUT",
            headers : {
                "Content-Type" : "application/json",
                Authorization : `Bearer ${session?.access_token}`,
            },
            body : JSON.stringify({
                text : note.text,
                pinned : !note.pinned,  
            }) 
        })
        if (!res.ok) {
            console.error("Pin failed");
            return;
        }
        const updated = await res.json();

        console.log("UPDATED:", updated);

        setNotes((prev) => 
            prev.map((n) => 
            n.id === note.id ? updated : n
            )    
        )
        } catch (err) {
            console.error(err);
            
        }
    }

    

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-pink-900 text-white p-8">


        {/* Header */}
        <div className="mb-8">
            <button
                onClick={() => {
                    if(!editingId){
                        router.push("/");
                    }
                }}
                className="mb-4 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
            >
                ← Back
            </button>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-pink-400 to-pink-800 bg-clip-text text-transparent">
                {topicName || "Loading..."}
            </h1>
            <p className="text-gray-400 mt-2">
                Your thoughts, organized beautifully ✨
            </p>
        </div>


        {/* Input */}
        <div className="flex gap-3 mb-8">
            <input 
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={!!editingId}
                placeholder="Write something amazing..."
                className="flex-1 p-4 rounded-xl bg-white/10 border border-white/10 backdrop-blur focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
            <button
                onClick={handleSubmit}
                disabled={ submitting ||  !text.trim() }
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 transition font-semibold shadow-lg disabled:opacity-50"
            >
                {submitting ? "Saving" : "Add"}
            </button>
        </div>


        {/* Notes list */}
            {!id ? (
                <p>Invalid Topic</p>
            ) : loading ? (
                <p>Loading...</p>
            ) : notes.length === 0 ? (
                <p>Notes not found</p>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...notes]
                        .filter((note) => note && note.id)
                        .sort((a, b) => Number(b.pinned) - Number(a.pinned))
                        .map((note : any) => (
                        <div key={note.id}
                            // className="group p-5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-lg hover:shadow-purple-500/20 transition relative"
                            //  className= {`group relative p-5 rounded-2xl backdrop-blur-xl border transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/20
                            className= {`group relative p-5 rounded-2xl backdrop-blur-xl border transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/20
                                ${ editingId === note.id ? "bg-white/20 border-purple-400"  : "bg-white/10 border-white/10" }
                                ${note.pinned ? "border-yellow-400 shadow-yellow-400/20" : ""}
                                `}
                        >

                            {/* <p className="pr-12 text-sm leading-relaxed">
                                {note.text}
                            </p> */}

                            {/* Inline Editing */}
                            {editingId === note.id ? (
                                <>
                                <textarea
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    onBlur={handleSubmit}
                                    autoFocus
                                    className="w-full bg-transparent outline-none resize-none text-sm pr-12 rounded-lg p-2 focus:bg-white/10"
                                    onKeyDown={(e) => {
                                        if(e.key === "Escape"){
                                            setEditingId(null);
                                            setEditingText("");
                                        }
                                    }}
                                />
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSubmit();
                                        }}
                                        className="px-2 py-2 text-xs bg-green-500/20 hover:bg-green-500/40 text-green-300 rounded-md"
                                    >
                                        ✔
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingId(null);
                                            setEditingText("");
                                        }}
                                        className="px-2 py-1 text-xs bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-md"
                                    >
                                        ✖
                                    </button>
                                </div>
                                </>
                            ) : (
                                <p
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingId(note.id);
                                        setEditingText(note.text);
                                    }}
                                    className="pr-12 text-sm leading-relaxed cursor-text break-words whitespace-pre-wrap"
                                >
                                    {note.text}
                                </p>
                            )}

                            <div>
                                <p className="text-xs text-gray-400 mt-2">
                                    {note.created_at
                                        ? new Date(note.created_at).toLocaleString()
                                        : "Just now" }
                                </p>
                                <div className={`
                                    absolute top-3 right-3 flex gap-2 transition-all duration-200
                                    ${editingId === note.id ? "hidden" : "opacity-0 group-hover:opacity-100"}
                                    `}
                                >

                                    {/*  PIN BUTTON */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            togglePin(note);
                                        }}
                                        className={`bg-blue-500/20 hover:bg-yellow-500/40 text-red-300 p-1 rounded-lg backdrop-blur-md hover:scale-110 transition ${
                                            note.pinned
                                            ? "border-yellow-400 ring-1 ring-yellow-400 shadow-lg shadow-yellow-300/30" : ""
                                        }`}
                                    >
                                        ⭐ 
                                    </button>

                                    {/* EDIT */}
                                    <button
                                        onClick={(e) =>{
                                            e.stopPropagation()
                                            handleEdit(note)
                                        }}
                                        className="bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 p-1 rounded-lg backdrop-blur-md hover:scale-110 transition"
                                    >
                                        ✏️
                                    </button>

                                    {/* DELETE */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDelete(note.id)
                                        } }
                                        className="bg-blue-500/20 hover:bg-red-500/40 text-red-300 p-1 rounded-lg backdrop-blur-md hover:scale-110 transition"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            // </div>
            )}
    </div>
  );
}
