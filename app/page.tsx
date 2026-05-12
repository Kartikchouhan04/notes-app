"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type note = {
  id: number;
  text: string;
  created_at: string;
};

export default function Home() {

  const [topics, setTopics] = useState<any[]>([]);
  const [topicName, setTopicName] = useState("");
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


  const router = useRouter();

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



  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }
  //auth check
  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) router.push("/login");
    }
    checkUser();
  }, []);



  async function fetchTopic() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const res = await fetch("/api/topics", {
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("fetchTopics error :", data);
      alert(getErrorMessage(data));
      return;
    }
    setTopics(data);
  }
  useEffect(() => {
    fetchTopic();
  }, []);



  async function addTopic() {
    if (!topicName.trim()) {
      alert("Topic name required");
      return;
    }
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const res = await fetch("/api/topics", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ name: topicName }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("addTopic error : ", data);
      alert(getErrorMessage(data));
      return;
    }
    setTopicName("");
    fetchTopic(); //to refresh ui
  }



  async function updateTopic(id : string) {

    if(!editingName.trim()) return;

    setUpdatingId(id);

    const { data : { session }} = await supabase.auth.getSession();

    const res = await fetch(`/api/topics/${id}`,{
      method : "PUT",
      headers : {
        "Content-Type" : "application/json",
        Authorization :  `Bearer ${session?.access_token}`
      },
      body : JSON.stringify({ name : editingName })
    })

    const data = await res.json();
    
    setUpdatingId(null);

    if(!res.ok){
      alert(getErrorMessage(data))
      return;
    }

    setTopics((prev) =>                           //update ui instantly
      prev.map((t) => (t.id === id ? {...t, name: editingName} : t))  
    );
    setEditingTopicId(null);
    setEditingName("");
  }



  async function deleteTopic(id : string) {
    const confirmDelete = confirm("Are you sure you want to delete this topic?");
    if(!confirmDelete) return;

    setDeletingId(id);

    const { data : { session }} = await supabase.auth.getSession();

    const res = await fetch(`/api/topics/${id}`, {
      method : "DELETE",
      headers : {
        Authorization : `Bearer ${session?.access_token}`
      }
    })
    setDeletingId(null);

    if(!res.ok){
      alert("failed to delete topic")
      return;
    }
    setTopics((prev) => prev.filter((t) => t.id !== id));
  }


  // async function fetchNotes(topicId?: string) {
  //   setLoading(true);

  //   const {
  //     data: { session },
  //   } = await supabase.auth.getSession();

  //   const url = topicId ? `/api/notes?topicId=${topicId}` : `/api/notes`;

  //   const res = await fetch(url, {
  //     headers: {
  //       Authorization: `Bearer ${session?.access_token}`,
  //     },
  //   });
  //   // const data = await res.json();
  //   let data;
  //   try {
  //     data = await res.json();
  //   } catch {
  //     alert("Invalid server response");
  //     setLoading(false);
  //     return;
  //   }
  //   if (!res.ok) {
  //     console.error("fetchNotes error : ", data);
  //     alert(getErrorMessage(data));
  //     setLoading(false);
  //     return;
  //   }
  //   setNotes(data);
  //   setLoading(false);
  // }
  // useEffect(() => {
  //   fetchNotes();
  // }, []);









  
//   return (
//   <div className="flex h-screen bg-gradient-to-br from-white-100 via-purple-900 to-white-100 text-white">
//     {/* Main */}
//     {/* <div className="animate-wave h-1 w-20 bg-pink-400"/>       */}
//     <div className="flex-1 p-8 overflow-y-auto">
//       {/* Header */}
//       <div className="flex items-center justify-between w-full mb-10">
//         <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-pink-300 to-pink-500 bg-clip-text text-transparent">
//           Thought Vault
//         </h1>

//         <button
//           onClick={handleLogout}
//           className="bg-gradient-to-r from-red-500 to-pink-500 px-5 py-2 rounded-xl hover:scale-105 active:scale-95 transition shadow-lg "
//         >
//           Logout
//         </button>
//       </div>

//       {/* Page Title */}
//       <h2 className="text-3xl font-bold mb-6">Topics</h2>

//       {/* Add Topic */}
//       <div className="flex gap-2 mb-6">
//         <input
//           value={topicName}
//           onChange={(e) => setTopicName(e.target.value)}
//           placeholder="New Topic"
//           className="w-full p-4 rounded-xl bg-white/10 border border-white/10 backdrop-blur focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:text-gray-400"
//         />
//         <button
//           onClick={addTopic}
//           className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 transition font-semibold shadow-lg"
//         >
//           Add
//         </button>
//       </div>

//       {/* Topics List */}
//       {topics.length === 0 ? (
//         <p className="text-gray-400">No topics yet</p>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
//           {topics.map((t) => (
//             <div
//                 key={t.id}
//                 onClick={() => router.push(`/topics/${t.id}`)}
//                 className="group p-6 rounded-2xl cursor-pointer bg-white/10 backdrop-blur-xl border border-white/10 hover:bg-white/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-lg hover:shadow-red-700/30"
//               >
//               <div className=" h-1 w-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full mb-3 transition-all duration-300 group-hover:w-20 group-hover:animate-wave"/>
//                 {/* Title */}
//                 <h3 className="text-lg font-semibold text-white mb-2 break-words whitespace-pre-wrap">
//                   {t.name}
//                 </h3>
//                 <p className="text-sm text-gray-300">
//                   Click to view notes...
//                 </p>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   </div>
// );



return (
  <div className="flex h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-pink-900 text-white">
    <div className="flex-1 p-8 overflow-y-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between w-full mb-10">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-pink-300 to-pink-500 bg-clip-text text-transparent">
          Thought Vault
        </h1>

        <button
          onClick={handleLogout}
          className="bg-gradient-to-r from-red-500 to-pink-500 px-5 py-2 rounded-xl hover:scale-105 active:scale-95 transition shadow-lg"
        >
          Logout
        </button>
      </div>

      {/* Page Title */}
      <h2 className="text-3xl font-bold mb-6">Topics</h2>

      {/* Add Topic */}
      <div className="flex gap-2 mb-6">
        <input
          value={topicName}
          onChange={(e) => setTopicName(e.target.value)}
          placeholder="New Topic"
          className="w-full p-4 rounded-xl bg-white/10 border border-white/10 backdrop-blur focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:text-gray-400"
        />

        <button
          onClick={addTopic}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 transition font-semibold shadow-lg"
        >
          Add
        </button>
      </div>

      {/* Topics List */}
      {topics.length === 0 ? (
        <p className="text-gray-400">No topics yet</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {topics.map((t) => (
            <div
              key={t.id}
              onClick={() => router.push(`/topics/${t.id}`)}
              className="group relative p-6 rounded-2xl cursor-pointer bg-white/10 backdrop-blur-xl border border-white/10 hover:bg-white/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-lg hover:shadow-red-700/30"
            >
              {/* Accent bar */}
              <div className="h-1 w-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full mb-3 transition-all duration-300 group-hover:w-20 group-hover:animate-wave" />

              {/* ACTION BUTTONS */}
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                
                {/* EDIT */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingTopicId(t.id);
                    setEditingName(t.name);
                  }}
                  className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30"
                >
                  ✏️
                </button>

                {/* DELETE */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTopic(t.id);
                  }}
                  className="text-xs px-2 py-1 rounded bg-red-500/70 hover:bg-red-600"
                >
                  {deletingId === t.id ? "..." : "🗑️"}
                </button>
              </div>

              {/* TITLE */}
              {editingTopicId === t.id ? (
              <div onClick={(e) => e.stopPropagation()}>
                <input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") updateTopic(t.id);
                    if (e.key === "Escape") {
                      setEditingTopicId(null);
                      setEditingName("");
                    }
                  }}
                  className="w-full bg-transparent border-b border-purple-400 outline-none text-lg font-semibold"
                />
                <p className="text-xs text-gray-400 opacity-80 mt-1">
                  Press Enter to save • Esc to cancel
                </p>
              </div>
              
              ) : (
                <h3 className="text-lg font-semibold text-white mb-2 break-words whitespace-pre-wrap">
                  {t.name}
                </h3>
              )}

              {/* LOADING STATE */}
              {updatingId === t.id && (
                <p className="text-xs text-blue-300">Saving...</p>
              )}

              <p className="text-sm text-gray-300">
                Click to view notes...
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

}
