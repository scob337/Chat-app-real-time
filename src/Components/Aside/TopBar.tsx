import { FaBarsStaggered } from "react-icons/fa6";
interface TopBarProps {
  SetToggle: React.Dispatch<React.SetStateAction<boolean>>
  isToggle:boolean
}


const TopBar = (props:TopBarProps) => {
  const {SetToggle , isToggle} = props

  const handleToggle = () => {
    SetToggle(prev => !prev)}  
  return (
          <header className="p-4 border-b border-gray-300 flex justify-between items-center bg-indigo-600 text-white">
            
            {isToggle && <h1 className="text-2xl font-semibold">Chat Web</h1>}
            <div className="relative">
              <button
              onClick={handleToggle}
              id="menuButton" className={`focus:outline-none flex justify-center items-center cursor-pointer ${isToggle ? 'w-fit' : 'w-full -m-2 '}`}>
<FaBarsStaggered size={36}/>
              </button>
              <div id="menuDropdown" className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-md shadow-lg hidden">
                <ul className="py-2 px-3">
                  <li><a href="#" className="block px-4 py-2 text-gray-800 hover:text-gray-400">Option 1</a></li>
                  <li><a href="#" className="block px-4 py-2 text-gray-800 hover:text-gray-400">Option 2</a></li>
                </ul>
              </div>
            </div>
          </header>
  )
}

export default TopBar
