"use client";
import React, { useEffect, useState } from "react";
import "quill/dist/quill.snow.css";

const researchTopics = [
  "Pest surveillance and management",
  "Sustainable farming practices",
  "Crop diversification",
  "Food systems",
  "Biofortification",
  "HIV/AIDS and other sexually transmitted infections",
  "Reproductive health and family planning",
  "Infectious diseases (e.g., malaria, Ebola, Marburg virus)",
  "Occupational safety and health in agriculture",
  "Advanced surgical techniques",
  "Higher education development",
  "Access to education in rural areas",
  "Educational technology integration",
  "Curriculum development",
  "Electronic case management systems",
  "Digital transformation in public services",
  "Artificial intelligence applications",
  "Post-genocide reconciliation and justice",
  "Social equity in healthcare",
  "Gender studies",
  "Community development",
  "Climate change adaptation",
  "Biodiversity conservation",
  "Sustainable urban planning",
  "Water resource management",
  "Trade and market dynamics",
  "Infrastructure development",
  "Social protection programs",
  "Energy sector growth",
  "Policy strengthening in labor sectors",
  "Public administration reforms",
  "Legal system effectiveness"
];

interface School {
  id: number;
  name: string;
};

interface Institution {
  id: number;
  name: string;
}

interface FormData {
  title: string;
  researcher: string;
  category: string;
  institution: string;
  status: string;
  school: string;
  year: string;
  abstract: string;
}


const AddResearch: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [focus, setFocus] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<FormData>({
    title: "",
    researcher: "",
    category: "",
    institution: "",
    status: "",
    school: "",
    year: "",
    abstract: "",
  });
  const [schools, setSchools] = useState<School[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let quillInstance: any = null;

    import("quill").then((QuillModule) => {
      const Quill = QuillModule.default; // ✅ Access the default export

      quillInstance = new Quill("#editor", {
        theme: "snow",
        modules: {
          toolbar: "#toolbar",
        },
      });

      quillInstance.on("text-change", () => {
        setFormData((prev) => ({
          ...prev,
          abstract: quillInstance.root.innerHTML,
        }));
      });
    });

    return () => {
      if (quillInstance) {
        quillInstance.off("text-change");
      }
    };
  }, []);
  // Fetch institutions
  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const response = await fetch("/api/institution");
        if (!response.ok) throw new Error("Failed to fetch institutions");
        const data = await response.json();
        setInstitutions(data);
      } catch (error) {
        setError("An error occurred while fetching institutions.");
      }
    };
    fetchInstitutions();
  }, []);

   // Fetch institutions
   useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await fetch("/api/schools");
        if (!response.ok) throw new Error("Failed to fetch Schools");
        const data = await response.json();
        setSchools(data);
      } catch (error) {
        setError("An error occurred while fetching Schools.");
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
    if (file) {
      payload.append("document", file);
    }

    try {

      const response = await fetch("/api/add/research", {
        method: "POST",
        body: payload,
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({
          title: "",
          researcher: "",
          category: "",
          institution: "",
          status: "",
          school: "",
          year: "",
          abstract: "",
        });
        setFile(null);
        onClose();
      } else {
        const error = await response.text();
        setError(`Submission failed. ${error}`);
      }
    } catch (error) {
      setError(`Submission failed. ${(error as Error).message}`);
    }
  };

    // File upload trigger handling
    useEffect(() => {
      const fileUploadTrigger = document.getElementById("file-upload-trigger");
      const fileUploadInput = document.getElementById("file-upload") as HTMLInputElement;
      const fileNameDisplay = document.getElementById("file-name");
  
      fileUploadTrigger?.addEventListener("click", () => {
        fileUploadInput?.click();
      });
  
      fileUploadInput?.addEventListener("change", (event) => {
        if (event.target instanceof HTMLInputElement && event.target.files?.[0]) {
          const file = event.target.files[0];
          setFile(file);
  
          if (fileNameDisplay) {
            fileNameDisplay.textContent = file.name;
          }
        }
      });
    }, []);

  return (
    <div className="fixed flex justify-center items-center bg-slate-400 w-full h-full top-0 left-0 z-30 backdrop-blur-sm bg-opacity-40 overflow-hidden overflow-y-visible">
      <i
        onClick={onClose}
        className="bi bi-x absolute right-4 px-[6px] py-[2px] border top-7 text-2xl font-bold cursor-pointer text-teal-50 bg-teal-500 border-teal-300 hover:bg-teal-200 hover:border rounded-full"
      ></i>
      <div className="w-3/5 bg-white rounded-lg px-5 py-3">
        <h4 className="text-center text-2xl mb-5 font-semibold text-teal-600">Upload Research Material </h4>
        <form className="space-y-6 px-8" onSubmit={handleSubmit}>
        {success || error && (
          <div
          className={`${success ? 'bg-green-100 text-green-500 border-green-300' : 'bg-red-100 text-red-500 border-red-300'} p-4 rounded-md`}
          >
            {success ? success : error ? error : ""}
          </div>
        )}


          <div className="grid grid-cols-2 gap-4">
            {[
              { id: "title", label: "Title", type: "text" },
              { id: "researcher", label: "Researcher", type: "text" },
            ].map((field) => (
              <div key={field.id} className="relative">
                <label
                  htmlFor={field.id}
                  className={`absolute left-3 text-gray-500 transition-all duration-300 ${
                    focus[field.id]
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
                  value={(formData as any)[field.id]}
                  onChange={handleChange}
                  required
                />
              </div>
            ))}
          </div>
          <div className="relative">
              <label
                htmlFor="category"
                className={`absolute left-3 text-gray-500 transition-all duration-300 ${
                  focus["category"]
                    ? "top-[-10px] text-sm bg-white px-1"
                    : "top-2 text-base"
                }`}
              >
                Research category<span className="text-red-500"> *</span>
              </label>
              <select
                id="category"
                className="w-full border rounded-md border-gray-300 px-3 py-2 bg-transparen2 focus:border-teal-500 focus:outline-none appearance-none transition-colors"
                onFocus={() => handleFocus("category")}
                onBlur={(e) => handleBlur("category", e.target.value)}
                value={formData.category}
                onChange={handleChange}
                required
              >
                 <option value=""></option>
                {researchTopics.map((topic, i) => (
                   <option key={i} value={topic}>{topic}</option>
                ))}
              </select>
            </div>

          <div className="grid grid-cols-2 gap-4">

           <div className="relative">
              <label
                htmlFor="institution"
                className={`absolute left-3 text-gray-500 transition-all duration-300 ${
                  focus["institution"]
                    ? "top-[-10px] text-sm bg-white px-1"
                    : "top-2 text-base"
                }`}
              >
                Institution<span className="text-red-500"> *</span>
              </label>
              <select
                id="institution"
                className="w-full border rounded-md border-gray-300 px-3 py-2 bg-transparen2 focus:border-teal-500 focus:outline-none appearance-none transition-colors"
                onFocus={() => handleFocus("institution")}
                onBlur={(e) => handleBlur("institution", e.target.value)}
                value={formData.institution}
                onChange={handleChange}
                required
              >
                 <option value=""></option>
                {institutions.map((institute) => (
                   <option key={institute.id} value={institute.id}>{institute.name}</option>
                ))}
              </select>
            </div>


            <div className="relative">
              <label
                htmlFor="status"
                className={`absolute left-3 text-gray-500 transition-all duration-300 ${
                  focus["status"]
                    ? "top-[-10px] text-sm bg-white px-1"
                    : "top-2 text-base"
                }`}
              >
                Status<span className="text-red-500"> *</span>
              </label>
              <select
                id="status"
                className="w-full border rounded-md border-gray-300 px-3 py-2 bg-transparen2 focus:border-teal-500 focus:outline-none appearance-none transition-colors"
                onFocus={() => handleFocus("status")}
                onBlur={(e) => handleBlur("status", e.target.value)}
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value=""></option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            
          </div>

          {/* File input and file name display */}
          <div className="relative">
            {/* File input and file name display */}
            <label
                htmlFor="file-upload"
                className={`absolute left-3 text-gray-500 transition-all duration-300 ${
                  focus["file-upload"]
                    ? "top-[-10px] text-sm bg-white px-1"
                    : "top-2 text-base"
                }`}
              >
               Upload document<span className="text-red-500"> *</span>
            </label>
          <input
            type="file"
            id="file-upload"
            style={{ display: "none" }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-teal-400 focus:outline-none transition-colors"
            onFocus={() => handleFocus("file_upload")}
            onBlur={(e) => handleBlur("file-upload", e.target.value)}
          />
          <button  type="button" id="file-upload-trigger" className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-teal-400 focus:outline-none transition-colors"
          >
            <span id="file-name" className="bi bi-upload text-sm text-gray-500"></span>
          </button>
           
          </div>
         
          <div className="grid grid-cols-2 gap-4">

           <div className="relative">
              <label
                htmlFor="school"
                className={`absolute left-3 text-gray-500 transition-all duration-300 ${
                  focus["school"]
                    ? "top-[-10px] text-sm bg-white px-1"
                    : "top-2 text-base"
                }`}
              >
                School<span className="text-red-500"> *</span>
              </label>
              <select
                id="school"
                className="w-full border rounded-md border-gray-300 px-3 py-2 bg-transparen2 focus:border-teal-500 focus:outline-none appearance-none transition-colors"
                onFocus={() => handleFocus("school")}
                onBlur={(e) => handleBlur("school", e.target.value)}
                value={formData.school}
                onChange={handleChange}
                required
              >
                <option value=""></option>
                {schools.map((school) => (
                   <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <label
                htmlFor="year"
                className={`absolute left-3 text-gray-500 transition-all duration-300 ${
                  focus["year"]
                    ? "top-[-10px] text-sm bg-white px-1"
                    : "top-2 text-base"
                }`}
              >
                Year<span className="text-red-500"> *</span>
              </label>
              <input
                id="year"
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-teal-400 focus:outline-none transition-colors"
                onFocus={() => handleFocus("year")}
                onBlur={(e) => handleBlur("year", e.target.value)}
                value={formData.year}
                onChange={handleChange}
                required
              />
            </div>


            

            
          </div>
          
          <div
        id="editor-container"
        className="w-full border rounded-md border-gray-300 px-3 py-2 bg-transparen2 focus:border-teal-500 focus:outline-none appearance-none transition-colors"
      >
        <div id="toolbar" className="rounded-t-lg border-b-0">
          <select className="ql-header">
            <option value="1"></option>
            <option value="2"></option>
            <option selected></option>
          </select>
          <button className="ql-bold"></button>
          <button className="ql-italic"></button>
          <button className="ql-underline"></button>
          <button className="ql-strike"></button>
          <button className="ql-list" value="ordered"></button>
          <button className="ql-list" value="bullet"></button>
          <button className="ql-link"></button>

          
        </div>
        <div className="relative">
          <label
            htmlFor="abstract"
            className={`absolute left-3 text-gray-500 transition-all duration-300 ${
              focus["abstract"]
                ? "top-[-50px] text-sm bg-white px-1"
                : "top-3 text-base"
            }`}
          >
            Abstract<span className="text-red-500"> *</span>
          </label>
          <div
            id="editor"
            aria-placeholder="Write the Abstract here..."
            className="w-full border border-t-0 rounded-b-md border-gray-300 px-3 bg-transparen2 focus:border-teal-500 focus:outline-none appearance-none transition-colors"
            onFocus={() =>{
              handleFocus("abstract");
            }}
            
          ></div>
        </div>
          
          
          </div>
           {/* Submit Button */}
           <div className="text-center">
            <button
              type="submit"
              className="w-[120px] border border-teal-400 text-teal-500 py-2 rounded-md hover:bg-teal-100 transition-all duration-300"
            >
              Add
            </button>
          </div>
        </form>
      
      </div>

    </div>
  );
}
export default AddResearch;