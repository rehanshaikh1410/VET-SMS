import React, { useState } from "react";
import { useLocation } from 'wouter';

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [name, setName] = useState("");
  const [, setLocation] = useLocation();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role, name }),
    });
    if (res.ok) {
      setLocation("/");
    } else {
      const err = await res.json();
      alert(err.message || "Failed to register");
    }
  }

  return (
    <form onSubmit={submit}>
      <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="username" />
      <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="password" type="password"/>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="full name" />
      <select value={role} onChange={e=>setRole(e.target.value)}>
        <option value="student">Student</option>
        <option value="teacher">Teacher</option>
      </select>
      <button type="submit">Register</button>
    </form>
  );
}
