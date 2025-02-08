"use client";
import React, { useEffect, useState } from "react";

interface FormData {
  name: string;
  label: string;
  school: string;
}

interface School{
  id: string;
  name: string;
  institute: string;
  college: string;
}

const AddDepartment: React.FC<{ onClose: () => void }> = ({ onClose }) => { 

  const [focus, setFocus] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<FormData>({
    name: "",
    label: "",
    school: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [Schools, setSchools] = useState<School[]>([])
  
      // get all Schoolss
      useEffect(() => {
        const fetchSchools = async () => {
          try {
            const response = await fetch("/api/schools?sort=name");
            if (!response.ok) throw new Error("Failed to fetch institutions");
            const data = await response.json();
            setSchools(data);
          } catch (error) {
            setError("An error occurred while fetching schools");
          }
        };
        fetchSchools();
      }, []);
  

  const handleFocus = (field: string) =>
    setFocus((prev) => ({ ...prev, [field]: true }));

  const handleBlur = (field: string, value: string) =>
    setFocus((prev) => ({ ...prev, [field]: value.trim().length > 0 }));

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) payload.append(key, value as string);
    });
   

    try {
      const response = await fetch("/api/add/department", {
        method: "POST",
        body: payload,
      });

      if (response.ok) {
        setSuccess("Added successful!");
        setFormData({
          name: "",
          label: "",
          school: "",
        });
        setFile(null);
      } else {
        const error = await response.text();
        setError(`Submission failed. ${error}`);
      }
    } catch (error) {
      setError(`Submission failed. ${(error as Error).message}`);
    }
  };

  return (
    <div className="fixed flex justify-center items-center bg-slate-400 w-full h-full top-0 left-0 z-30 backdrop-blur-sm bg-opacity-40">
      <i
        onClick={onClose}
        className="bi bi-x absolute right-4 px-[6px] py-[2px] border top-7 text-2xl font-bold cursor-pointer text-teal-50 bg-teal-500 border-teal-300 hover:bg-teal-200 hover:border rounded-full"
      ></i>
      <div className="w-3/5 bg-white rounded-lg p-5">
        <h4 className="text-center text-3xl my-3 pb-5 font-semibold text-teal-500">Add department </h4>
        
        <form className="space-y-6 px-8" onSubmit={handleSubmit}>
        {(success || error) && (
          <div
          className={`${success?.includes('success') ? 'bg-green-100 text-green-500 border-green-300 ' : ' bg-red-100 text-red-500 border-red-300 '} font-semibold p-4 rounded-md`}
          >
            {success ? success : error ? error : ""}
          </div>
        )}
          {/* Row 1: Name and label */}
          <div className="grid grid-cols-2 gap-4">
          
          <div className="relative">
            <label
              htmlFor="name"
              className={`absolute left-3 text-gray-500 transition-all duration-300 ${
                focus["name"]
                  ? "top-[-10px] text-sm bg-white px-1"
                  : "top-2 text-base"
              }`}
            >
              Name <span className="text-red-500"> *</span>
            </label>
            <input
              id="name"
              type="name"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-teal-400 focus:outline-none transition-colors"
              onFocus={() => handleFocus("name")}
              onBlur={(e) => handleBlur("name", e.target.value)}
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

         

            {/* Row 2: label */}
           <div className="relative">
            <label
              htmlFor="label"
              className={`absolute left-3 text-gray-500 transition-all duration-300 ${
                focus["label"]
                  ? "top-[-10px] text-sm bg-white px-1"
                  : "top-2 text-base"
              }`}
            >
              Label <span className="text-red-500"> *</span>
            </label>
            <input
              id="label"
              type="label"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-teal-400 focus:outline-none transition-colors"
              onFocus={() => handleFocus("label")}
              onBlur={(e) => handleBlur("label", e.target.value)}
              value={formData.label}
              onChange={handleChange}
              required
            />
          </div>
          </div>
          <div className="relative">
              <label
                htmlFor="school"
                className={`absolute left-3 text-gray-500 transition-all duration-300 ${
                  focus["school"]
                    ? "top-[-10px] text-sm bg-white px-1"
                    : "top-2 text-base"
                }`}
              >
                School <span className="text-red-500"> *</span>
              </label>
              <select
                id="school"
                className="w-full border rounded-md border-gray-300 px-3 py-2 bg-transparen2 focus:border-teal-500 focus:outline-none appearance-none transition-colors"
                onFocus={() => handleFocus("school")}
                onBlur={(e) => handleBlur("school", e.target.value)}
                value={formData.school}
                name="school"
                onChange={handleChange}
                required
              >
                <option value=""></option>
                {Schools.map((School,i) => (
                  <option key={i} value={School.id}>{School.name + " - [ "+ School.college + " ] [ "+ School.institute + " ]"} </option>
                ))}
              </select>
            </div>
           

           
             {/* Submit Button */}
            <div className="text-center">
             <button
              type="submit"
              className="w-[150px] border border-teal-400 text-teal-500 py-2 rounded-md hover:bg-teal-100 transition-all duration-300"
             >
              Add
             </button>
            </div>
       

        </form>
      
      </div>
    </div>
  )
}
export default AddDepartment;