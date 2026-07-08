import { AlertTriangle, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";


const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger",
  isLoading = false
}) => {


  return (
    <AnimatePresence>

      {isOpen && (

        <div className="
          fixed
          inset-0
          z-50
          flex
          items-center
          justify-center
          px-4
        ">


          {/* Background */}
          <motion.div

            initial={{opacity:0}}
            animate={{opacity:1}}
            exit={{opacity:0}}

            onClick={onClose}

            className="
              absolute
              inset-0
              bg-black/70
              backdrop-blur-sm
            "
          />


          {/* Modal */}
          <motion.div

            initial={{
              opacity:0,
              scale:0.95,
              y:20
            }}

            animate={{
              opacity:1,
              scale:1,
              y:0
            }}

            exit={{
              opacity:0,
              scale:0.95,
              y:20
            }}

            className="
              relative
              z-10
              w-full
              max-w-md
              bg-[#18181B]
              border
              border-[#27272A]
              rounded-xl
              shadow-2xl
            "

          >


            {/* Header */}

            <div className="
              flex
              items-center
              justify-between
              px-5
              py-4
              border-b
              border-[#27272A]
            ">

              <div className="
                flex
                items-center
                gap-3
              ">


                <div className="
                  p-2
                  rounded-lg
                  bg-red-500/10
                  border
                  border-red-500/20
                  text-red-400
                ">
                  <AlertTriangle className="w-5 h-5"/>
                </div>


                <h2 className="
                  text-sm
                  font-semibold
                  text-white
                ">
                  {title}
                </h2>


              </div>



              <button
                onClick={onClose}
                className="
                  p-1.5
                  rounded-lg
                  text-[#A1A1AA]
                  hover:text-white
                  hover:bg-[#27272A]
                  transition
                  cursor-pointer
                "
              >

                <X className="w-4 h-4"/>

              </button>


            </div>



            {/* Content */}

            <div className="p-5">


              <p className="
                text-xs
                text-[#A1A1AA]
                leading-relaxed
              ">
                {message}
              </p>



              <div className="
                flex
                gap-3
                mt-6
              ">


                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="
                    flex-1
                    py-2.5
                    rounded-lg
                    border
                    border-[#27272A]
                    text-xs
                    font-semibold
                    text-[#A1A1AA]
                    hover:text-white
                    hover:bg-[#27272A]
                    transition
                    cursor-pointer
                  "
                >

                  {cancelText}

                </button>




                <button

                  onClick={onConfirm}

                  disabled={isLoading}

                  className={`
                    flex-1
                    py-2.5
                    rounded-lg
                    text-xs
                    font-semibold
                    text-white
                    transition
                    cursor-pointer

                    ${
                      type === "danger"
                      ?
                      "bg-red-500 hover:bg-red-600"
                      :
                      "bg-[#F97316] hover:bg-[#EA580C]"
                    }

                    ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
                  `}

                >

                  {isLoading ? "Processing..." : confirmText}


                </button>


              </div>


            </div>


          </motion.div>



        </div>

      )}

    </AnimatePresence>
  );

};


export default ConfirmationModal;