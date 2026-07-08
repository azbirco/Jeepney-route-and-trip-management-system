import { useState } from "react";
import api from "../services/api";

import {
  FileBarChart2,
  RefreshCw,
  Calendar,
  Users,
  Bus,
  Route,
  PhilippinePeso,
  Activity
} from "lucide-react";

import { motion } from "framer-motion";


const Reports = () => {


  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);

  const [reportData, setReportData] = useState(null);

  const [selectedReport, setSelectedReport] = useState("");

  const [startDate, setStartDate] = useState("");

  const [endDate, setEndDate] = useState("");




  const reports = [

    {
      id:"daily-trips",
      name:"Daily Trip Report",
      icon:<Activity/>
    },

    {
      id:"passengers",
      name:"Passenger Summary",
      icon:<Users/>
    },

    {
      id:"routes",
      name:"Route Summary",
      icon:<Route/>
    },

    {
      id:"jeepneys",
      name:"Jeepney Activity",
      icon:<Bus/>
    },

    {
      id:"revenue",
      name:"Revenue Summary",
      icon:<PhilippinePeso/>
    }

  ];





  const generateReport = async(report)=>{


    try {


      setLoading(true);

      setError(null);

      setReportData(null);

      setSelectedReport(report.name);



      const params = {};

      if(startDate)
        params.startDate = startDate;


      if(endDate)
        params.endDate = endDate;




      const response = await api.get(

        `/reports/${report.id}`,

        {
          params
        }

      );



      setReportData(response.data.data);



    }

    catch(error){


      setError(

        error.response?.data?.message ||

        "Failed to generate report"

      );


    }

    finally{


      setLoading(false);


    }


  };





  if(loading){


    return (

      <div className="flex items-center justify-center min-h-screen">

        <RefreshCw

          className="animate-spin text-orange-500"

          size={40}

        />

      </div>

    );


  }





  return (

    <div className="space-y-6">



      <div>


        <h1 className="text-3xl font-bold text-white">

          Reports

        </h1>


        <p className="text-zinc-400 mt-1">

          Transportation analytics and operational reports

        </p>


      </div>







      {/* FILTER */}


      <motion.div

        initial={{
          opacity:0,
          y:20
        }}

        animate={{
          opacity:1,
          y:0
        }}

        className="
        bg-zinc-900
        border
        border-zinc-800
        rounded-2xl
        p-6
        "

      >


        <div className="flex items-center gap-3 mb-5">


          <Calendar className="text-orange-500"/>


          <h2 className="font-semibold text-lg">

            Report Period

          </h2>


        </div>




        <div className="grid md:grid-cols-2 gap-4">


          <input

            type="date"

            value={startDate}

            onChange={(e)=>setStartDate(e.target.value)}

            className="
            bg-zinc-800
            border
            border-zinc-700
            rounded-xl
            p-3
            text-white
            "

          />



          <input

            type="date"

            value={endDate}

            onChange={(e)=>setEndDate(e.target.value)}

            className="
            bg-zinc-800
            border
            border-zinc-700
            rounded-xl
            p-3
            text-white
            "

          />


        </div>


      </motion.div>









      {/* REPORT BUTTONS */}


      <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-5">


        {
          reports.map(report=>(


            <motion.button


              key={report.id}


              whileHover={{
                y:-5
              }}


              onClick={()=>generateReport(report)}


              className="

              bg-zinc-900

              border

              border-zinc-800

              rounded-2xl

              p-5

              text-left

              hover:border-orange-500

              transition

              "


            >


              <div className="text-orange-500 mb-4">

                {report.icon}

              </div>


              <p className="font-semibold">

                {report.name}

              </p>



              <span className="text-xs text-zinc-500">

                Generate report

              </span>



            </motion.button>


          ))

        }


      </div>








      {/* ERROR */}


      {
        error &&

        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-red-400">

          {error}

        </div>

      }









      {/* RESULT */}



      {
        reportData &&


        <motion.div


          initial={{
            opacity:0,
            y:20
          }}


          animate={{
            opacity:1,
            y:0
          }}


          className="
          bg-zinc-900
          border
          border-zinc-800
          rounded-2xl
          p-6
          "

        >


          <div className="flex items-center gap-3 mb-6">


            <FileBarChart2 className="text-orange-500"/>


            <h2 className="text-xl font-bold">

              {selectedReport}

            </h2>


          </div>




          <pre

            className="
            bg-zinc-950
            border
            border-zinc-800
            rounded-xl
            p-5
            overflow-auto
            text-sm
            text-zinc-300
            "

          >

            {
              JSON.stringify(
                reportData,
                null,
                2
              )
            }


          </pre>


        </motion.div>


      }



    </div>


  );

};



export default Reports;