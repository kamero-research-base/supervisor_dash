"use client";
import React, { useEffect, useState } from "react";
import Preloader from "../app/buttonPreloader";

// The interfaces define the shape of your data
interface Departments {
  id: number;
  name: string;
  school: string;
  institute: string;
  college?: string;
  label?: string;
  status?: string;
}

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department: string;
  uniqueid: string;
}

const AddStudent: React.FC<{ onClose: () => void; onStudentAdded?: () => void }> = ({
  onClose,
  onStudentAdded,
}) => {
  const [focus, setFocus] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    department: "",
    uniqueid: "",
  });
  const [departments, setDepartments] = useState<Departments[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setIsLoadingDepartments(true);
        setError(null);

        let school_id = "";
        try {
          const sessionData =
            localStorage.getItem("supervisorSession") ||
            sessionStorage.getItem("supervisorSession");
          if (sessionData) {
            const userSession = JSON.parse(sessionData);
            if (userSession && userSession.school_id) {
              school_id = userSession.school_id;
            }
          }
        } catch (parseError) {
          console.error("Error parsing session data:", parseError);
        }

        const url = school_id
          ? `/api/departments?school_id=${school_id}`
          : `/api/departments`;

        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            message: "Failed to fetch departments.",
          }));
          throw new Error(errorData.message);
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          setDepartments(data);
          if (data.length === 0) {
            setError("No departments found. Please add departments first.");
          }
        } else {
          setError("Received invalid data format for departments from server.");
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
        setError(error instanceof Error ? error.message : "An unknown error occurred.");
      } finally {
        setIsLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, []);

  const handleFocus = (field: string) => setFocus((prev) => ({ ...prev, [field]: true }));

  const handleBlur = (field: string, value: string) =>
    setFocus((prev) => ({ ...prev, [field]: value.trim().length > 0 }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (
      !formData.first_name ||
      !formData.last_name ||
      !formData.email ||
      !formData.phone ||
      !formData.department ||
      !formData.uniqueid
    ) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    const selectedDept = departments.find((d) => d.id.toString() === formData.department);
    if (!selectedDept) {
      setError("Please select a valid department");
      setLoading(false);
      return;
    }

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      payload.append(key, value);
    });

    payload.append("institute", selectedDept.institute || "");

    try {
      const response = await fetch("/api/add/student", {
        method: "POST",
        body: payload,
      });

      const responseText = await response.text();
      let responseData;

      try {
        responseData = JSON.parse(responseText);
      } catch (err) {
        console.error("Failed to parse JSON response:", responseText);
        setError(`Submission failed. The server returned an unexpected response.`);
        setLoading(false);
        return;
      }

      if (response.ok) {
        setSuccess("Student added successfully!");
        setFormData({
          first_name: "",
          last_name: "",
          email: "",
          phone: "",
          department: "",
          uniqueid: "",
        });

        if (onStudentAdded) {
          setTimeout(() => {
            onStudentAdded();
          }, 1500);
        }
        setLoading(false);
      } else {
        setError(responseData.message || responseData.error || "Submission failed due to a server error.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Submission error:", error);
      setError(`Submission failed: ${(error as Error).message}`);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-slate-400 z-50 backdrop-blur-sm bg-opacity-40">
      {/* Modal container with adjusted positioning */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Close button */}
        <i
          onClick={onClose}
          className="bi bi-x absolute right-8 top-8 px-[6px] py-[2px] border text-2xl font-bold cursor-pointer text-teal-50 bg-teal-500 border-teal-300 hover:bg-teal-200 hover:border rounded-full z-10"
        ></i>
        
        {/* Form container - adjusted to avoid sidebar overlap */}
        <div className="w-full max-w-3xl mx-auto bg-white rounded-lg p-5 max-h-[90vh] overflow-y-auto ml-64 mr-8">
          <h4 className="text-center text-3xl my-3 pb-5 font-semibold text-teal-500">Add Student</h4>

          <form className="space-y-6 px-8" onSubmit={handleSubmit}>
            {(success || error) && (
              <div
                className={`${
                  success
                    ? "bg-green-100 text-green-600 border border-green-300"
                    : "bg-red-100 text-red-600 border border-red-300"
                } font-semibold p-4 rounded-md`}
              >
                {success || error}
              </div>
            )}

            {isLoadingDepartments && (
              <div className="bg-blue-100 text-blue-600 border border-blue-300 p-4 rounded-md">
                <i className="bi bi-arrow-clockwise animate-spin mr-2"></i>
                Loading departments...
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {[
                { id: "first_name", label: "First Name", type: "text" },
                { id: "last_name", label: "Other Names", type: "text" },
              ].map((field) => (
                <div key={field.id} className="relative">
                  <label
                    htmlFor={field.id}
                    className={`absolute left-3 text-gray-500 transition-all duration-300 ${
                      focus[field.id] || formData[field.id as keyof FormData]
                        ? "top-[-10px] text-sm bg-white px-1"
                        : "top-2 text-base"
                    }`}
                  >
                    {field.label}
                    <span className="text-red-500"> *</span>
                  </label>
                  <input
                    id={field.id}
                    type={field.type}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-teal-400 focus:outline-none transition-colors"
                    onFocus={() => handleFocus(field.id)}
                    onBlur={(e) => handleBlur(field.id, e.target.value)}
                    value={formData[field.id as keyof FormData]}
                    onChange={handleChange}
                    required
                  />
                </div>
              ))}
            </div>

            <div className="relative">
              <label
                htmlFor="email"
                className={`absolute left-3 text-gray-500 transition-all duration-300 ${
                  focus["email"] || formData.email
                    ? "top-[-10px] text-sm bg-white px-1"
                    : "top-2 text-base"
                }`}
              >
                Email<span className="text-red-500"> *</span>
              </label>
              <input
                id="email"
                type="email"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-teal-400 focus:outline-none transition-colors"
                onFocus={() => handleFocus("email")}
                onBlur={(e) => handleBlur("email", e.target.value)}
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label
                  htmlFor="phone"
                  className={`absolute left-3 text-gray-500 transition-all duration-300 ${
                    focus["phone"] || formData.phone
                      ? "top-[-10px] text-sm bg-white px-1"
                      : "top-2 text-base"
                  }`}
                >
                  Phone Number<span className="text-red-500"> *</span>
                </label>
                <input
                  id="phone"
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-teal-400 focus:outline-none transition-colors"
                  onFocus={() => handleFocus("phone")}
                  onBlur={(e) => handleBlur("phone", e.target.value)}
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="relative">
                <label
                  htmlFor="uniqueid"
                  className={`absolute left-3 text-gray-500 transition-all duration-300 ${
                    focus["uniqueid"] || formData.uniqueid
                      ? "top-[-10px] text-sm bg-white px-1"
                      : "top-2 text-base"
                  }`}
                >
                  Student unique ID<span className="text-red-500"> *</span>
                </label>
                <input
                  id="uniqueid"
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-teal-400 focus:outline-none transition-colors"
                  onFocus={() => handleFocus("uniqueid")}
                  onBlur={(e) => handleBlur("uniqueid", e.target.value)}
                  value={formData.uniqueid}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Department field with label above and dynamic placeholder option */}
            <div className="relative">
              <label
                htmlFor="department"
                className="block mb-1 text-gray-700 font-medium"
              >
                Department <span className="text-red-500">*</span>
              </label>
              <select
                id="department"
                className="w-full border rounded-md border-gray-300 px-3 py-2 bg-transparent focus:border-teal-500 focus:outline-none appearance-none transition-colors"
                onFocus={() => handleFocus("department")}
                onBlur={(e) => handleBlur("department", e.target.value)}
                value={formData.department}
                onChange={handleChange}
                required
                disabled={isLoadingDepartments || departments.length === 0}
              >
                <option value="">
                  {focus["department"] ? "Select a department" : "Select a Department"}
                </option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name || department.label} - {department.school}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-center flex justify-center items-center">
              <button
                type="submit"
                className="w-[150px] flex items-center justify-center gap-2 border border-teal-400 text-teal-500 py-2 rounded-md hover:bg-teal-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoadingDepartments || loading}
              >
               {loading && <Preloader/>}
                Add Student 
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddStudent;