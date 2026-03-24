import { createContext, useEffect, useState } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [student, setStudent] = useState(null);
  const [hod, setHOD] = useState(null);
  const [coordinator, setCoordinator] = useState(null);
  const [doaa, setDOAA] = useState(null);
  const [finance, setFinance] = useState(null);

  // Read all user roles from localStorage on initial load
  useEffect(() => {
    const storedStudent = localStorage.getItem("ICMPstudent");
    if (storedStudent) setStudent(JSON.parse(storedStudent));

    const storedHOD = localStorage.getItem("ICMPhod");
    if (storedHOD) setHOD(JSON.parse(storedHOD));

    const storedCoordinator = localStorage.getItem("ICMPcoordinator");
    if (storedCoordinator) setCoordinator(JSON.parse(storedCoordinator));

    const storedDOAA = localStorage.getItem("ICMPdoaa");
    if (storedDOAA) setDOAA(JSON.parse(storedDOAA));
  }, []);

  // Sync student
  useEffect(() => {
    if (student) {
      localStorage.setItem("ICMPstudent", JSON.stringify(student));
    } else {
      localStorage.removeItem("ICMPstudent");
    }
  }, [student]);

  // Sync hod
  useEffect(() => {
    if (hod) {
      localStorage.setItem("ICMPhod", JSON.stringify(hod));
    } else {
      localStorage.removeItem("ICMPhod");
    }
  }, [hod]);

  // Sync coordinator
  useEffect(() => {
    if (coordinator) {
      localStorage.setItem("ICMPcoordinator", JSON.stringify(coordinator));
    } else {
      localStorage.removeItem("ICMPcoordinator");
    }
  }, [coordinator]);

  // Sync doaa
  useEffect(() => {
    if (doaa) {
      localStorage.setItem("ICMPdoaa", JSON.stringify(doaa));
    } else {
      localStorage.removeItem("ICMPdoaa");
    }
  }, [doaa]);

  return (
    <UserContext.Provider
      value={{
        student,
        setStudent,
        hod,
        setHOD,
        coordinator,
        setCoordinator,
        doaa,
        setDOAA,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
