interface SendMSGProps {
  content: string;
}

const SendMSG = ({ content }: SendMSGProps) => {
  return (
    <div className="flex justify-end mb-2">
      <div className="bg-green-500 text-white p-3 rounded-lg max-w-xs lg:max-w-md shadow-sm">
        <p className="text-sm -ml-1 break-words">You</p>
        <p className="text-sm pl-2 break-words whitespace-pre-wrap overflow-wrap-anywhere">{content}</p>
        <div className="flex items-center justify-end mt-1 gap-1">
          <span className="text-xs text-green-100">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <svg className="w-4 h-4 text-green-100" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default SendMSG;
