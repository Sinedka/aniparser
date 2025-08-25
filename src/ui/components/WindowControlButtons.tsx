import { FaRegSquare, FaPlus, FaMinus } from "react-icons/fa6";
import "./WindowControlButtons.css"

export default function WindowControllButtons(){
  return(
    <div className="window-controll-buttons">
      <button className="close-window">
        <FaPlus />
      </button>
      <button className="fullscreen-window">
        <FaRegSquare />
      </button>

      <button className="hide-window">
        <FaMinus />
      </button>

    </div>
  )

}
