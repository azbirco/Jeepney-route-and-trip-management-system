import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const FormModal = ({
  isOpen,
  onClose,
  title,
  icon,
  children
}) => {

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">

          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="
              relative 
              w-full 
              max-w-lg 
              bg-[#18181B]
              border
              border-[#27272A]
              rounded-xl
              shadow-2xl
              overflow-hidden
              z-10
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

              <div className="flex items-center gap-3">

                <div className="
                  p-2
                  rounded-lg
                  bg-[#F97316]/10
                  border
                  border-[#F97316]/20
                  text-[#F97316]
                ">
                  {icon}
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


            {/* Body */}
            <div className="
              p-5
              max-h-[80vh]
              overflow-y-auto
            ">
              {children}
            </div>


          </motion.div>

        </div>
      )}
    </AnimatePresence>
  );
};


export default FormModal;