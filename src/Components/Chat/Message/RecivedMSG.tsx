interface RecivedMSGProps {
  content: string;
  sender: string;
}

const RecivedMSG = ({ content, sender }: RecivedMSGProps) => {
  return (
    <div className="flex justify-start mb-2">
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 bg-gray-300 rounded-full overflow-hidden flex-shrink-0">
          <img
            src={`https://avatar.iran.liara.run/username?username=${sender}`}
            alt={sender}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="bg-white p-3 rounded-lg max-w-xs lg:max-w-md shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 mb-1 font-medium break-words">{sender}</p>
          <p className="text-sm text-gray-800 break-words whitespace-pre-wrap overflow-wrap-anywhere">{content}</p>
          <span className="text-xs text-gray-400 mt-1 block">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RecivedMSG;
