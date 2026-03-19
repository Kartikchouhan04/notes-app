"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { div } from "framer-motion/client";

type note = {
  id: number;
  text: string;
  created_at : string
};

export default function Home() {
  const [notes, setNotes] = useState<note[]>([]);
  const [text, setText] = useState("");
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editingNote, setEditingNote] = useState<note | null>(null);
  const [editText, setEditText] = useState("");



  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.push("/login");
      }
    }
    checkUser();
  }, []);

  async function fetchNotes() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const res = await fetch("/api/notes", {
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
      },
    });
    const data = await res.json();
    setNotes(data);
  }
  useEffect(() => {
    fetchNotes();
  }, []);

  async function addNote() {
    if (!text.trim()) {
      alert("note cannot be empty");
      return;
    }
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const res = await fetch("/api/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ text }),
    });

    const data = await res.json(); //
    console.log("POST response:", data); //

    if (!res.ok) {
      alert(data.error);
      return;
    }

    setText("");
    fetchNotes();
  }

  async function deleteNote(id: number) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    await fetch("/api/notes", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ id }),
    });
    fetchNotes();
  }


  async function updateNote() {
    if(!editingNote)return;
    const { data : { session }} = await supabase.auth.getSession();

    const res = await fetch("/api/notes",{
      method : "PUT",
      headers : {
        "Content-type" : "application/json",
        Authorization : `Bearer ${session?.access_token}`
      },
      body : JSON.stringify({
        id : editingNote.id,
        text : editText
      }),
    });
    if(!res.ok){
      const data = await res.json();
      alert(data.error || "update failed")
      return
    }
    console.log("Editing:", editingNote);
    console.log("Sending:", {
      id: editingNote.id,
      text: editText
    });

    setNotes((prev) =>
      prev.map((note) =>
        note.id === editingNote.id
          ? { ...note, text: editText }
          : note
      )
    );

    setEditingNote(null);
    setEditText("")

  }


  return (
    <div className="flex h-screen bg-gradient-to-br from-white-100 via-purple-900 to-white-100 text-white">
      {/* Sidebar */}
      <div className="w-64 p-6 border-r border-white/10 bg-white/5 backdrop-blur-xl">
        <h2 className="text-2xl font-bold mb-10 tracking-wide">⚡ Notes</h2>

        <ul className="space-y-4 text-gray-300">
          <li className="hover:text-blue-400 transition cursor-pointer">
            📄 Notes
          </li>
          <li className="hover:text-blue-400 transition cursor-pointer">
            📊 Analytics
          </li>
          <li className="hover:text-blue-400 transition cursor-pointer">
            ⚙️ Settings
          </li>
        </ul>
      </div>

      {/* Main */}
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

        {/* Input */}
        <div className="flex gap-3 mb-10">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write something amazing..."
            className="flex-1 p-4 rounded-xl bg-white/10 backdrop-blur-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />

          <button
            onClick={addNote}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 transition font-semibold shadow-lg"
          >
            Add
          </button>
        </div>

        {/* Stats */}
        <div className="mb-10">
          <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl w-60">
            <h3 className="text-gray-400">Total Notes</h3>
            <p className="text-4xl font-bold mt-2">{notes.length}</p>
          </div>
        </div>

        {/* Search notes */}
        <input
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-6 w-full p-4 rounded-xl bg-white/10 border border-white/10 backdrop-blur focus:outline-none focus:ring-2 focus:ring-purple-500 transition placeholder:text-gray-400"
        />

        {/* Notes Grid */}
        {notes.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            No notes yet. Start writing ✍️
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes
              .filter((note) =>
                note.text.toLowerCase().includes(search.toLowerCase()),
              )
              .map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.03 }}
                  className="group relative p-5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-lg hover:shadow-red-900/50 transition"
                >
                  <p className="text-gray-200 break-words">{note.text}</p>

                  {/* Edit Notes */}
                  <button
                    onClick={() => {
                      setEditingNote(note);
                      setEditText(note.text);
                    }}
                    className="absolute top-3 right-10 opacity-0 group-hover:opacity-100 transition text-blue-400 hover:text-blue-600"
                  >
                    ✏️
                  </button>

                  {/*time-notes created at*/}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(note.created_at).toLocaleString()}
                  </p>

                  {/* Delete button appears on hover */}
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition text-red-900 hover:text-red-900"
                  >
                    ❌
                  </button>
                </motion.div>
              ))}
          </div>
        )}
      </div>

      {/* EDIT MODAL(note) */}
      {editingNote && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-black-sm z-50">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl">
            <h2 className="text-xl font-semibold mb-4">Edit Note</h2>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-4 rounded-xl bg-white/10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditingNote(null)}
                className="px-4 py-2 rounded-lg bg-gray-500/20 hover:bg-gray-500/30"
              >
                Cancel
              </button>

              <button
                onClick={updateNote}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 hover:scale-105 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


  //   return (
  //     <div className="flex h-screen bg-gradient-to-br from-black via-red-900 to-black text-white">

  //       {/* Sidebar */}
  //       <div className="w-64 bg-white/5 backdrop-blur-lg border-r border-white/10 p-6">
  //         <h2 className="text-2xl font-bold mb-8 tracking-wide">Dashboard</h2>
  //         <ul className="space-y-4 text-gray-300">
  //           <li className="hover:text-blue-400 cursor-pointer transition">📄 Notes</li>
  //           <li className="hover:text-blue-400 cursor-pointer transition">📊 Analytics</li>
  //           <li className="hover:text-blue-400 cursor-pointer transition">📊 Settings</li>
  //         </ul>
  //       </div>

  //       {/* Main Content */}
  //       <div className="flex-1 p-8">

  //         {/* Header */}
  //         <div className="flex justify-between items-center mb-6">
  //           <h1 className="text-3xl font-bold">Notes Dashboard</h1>
  //           <button
  //             onClick={handleLogout}
  //             className="bg-gradient-to-r from-red-500 to-pink-500 px-5 py-2 rounded-xl hover:opacity-90 active:scale-95 transition"
  //           >
  //             Logout
  //           </button>
  //         </div>

  //         {/* Input Section */}
  //         <div className="flex gap-3 mb-8">
  //           <input
  //             value={text}
  //             onChange={(e) => setText(e.target.value)}
  //             placeholder="Write something amazing..."
  //             className="flex-1 p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
  //           />
  //           <button
  //             onClick={addNote}
  //             className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 transition font-semibold"
  //           >
  //             Add
  //           </button>
  //         </div>

  //         <div className="grid grid-cols-3 gap-4 mb-8">
  //           <div className="bg-white/5 backdrop-blur border border-white/10 p-6 rounded-xl">
  //             <h3 className="text-gray-400">Total Notes</h3>
  //             <p className="text-3xl font-bold mt-2">{notes.length}</p>
  //           </div>
  //         </div>

  //         {/* Notes List */}

  //         <div className="grid gap-3">
  //           {notes.map((note) => (
  //             <motion.div
  //               key={note.id}
  //               initial={{ opacity : 0, y: 20 }}
  //               animate={{ opacity : 1, y: 0 }}
  //               whileHover={{ scale : 1.02 }}
  //               className="flex justify-between items-center bg-white/5 border border-white/10 backdrop-blur p-5 rounded-xl shadow-lg hover:shadow-blue-500/10 transition"
  //             >
  //               <span>{note.text}</span>

  //               <button
  //                 onClick={() => deleteNote(note.id)}
  //                 className="text-red-400 hover:text-red-600 transition"
  //               >
  //                 ❌
  //               </button>
  //             </motion.div>
  //           ))}
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }