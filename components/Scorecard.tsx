
const CheckIcon = ({ checked }) => (
  <span className={`mr-2 flex-shrink-0 w-6 h-6 flex items-center justify-center rounded border ${checked ? 'bg-green-100 border-green-500 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-400'}`}>
    {checked ? <i className="fas fa-check text-xs"></i> : <i className="fas fa-times text-xs"></i>}
  </span>
);

export const Scorecard = ({ scorecard, rating }) => {
  const getRatingColor = (r) => {
    switch (r) {
      case 'Ready for Review': return 'bg-green-100 text-green-800 border-green-200';
      case 'Needs Minor Polish': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Needs Structural Rework': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-blue-600 px-6 py-4">
        <h3 className="text-white font-bold text-lg">Section 1: The Pulse Readiness Scorecard</h3>
      </div>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <CheckIcon checked={scorecard.conversationalTone} />
            <span className="text-gray-700 text-sm">Conversational Tone</span>
          </div>
          <div className="flex items-center">
            <CheckIcon checked={scorecard.scannability} />
            <span className="text-gray-700 text-sm">Scannability</span>
          </div>
          <div className="flex items-center">
            <CheckIcon checked={scorecard.creativeFormatting} />
            <span className="text-gray-700 text-sm">Creative Formatting</span>
          </div>
          <div className="flex items-center">
            <CheckIcon checked={scorecard.packaging} />
            <span className="text-gray-700 text-sm">"Packaging" (Title/Hook)</span>
          </div>
          <div className="flex items-center">
            <CheckIcon checked={scorecard.adminCheck} />
            <span className="text-gray-700 text-sm">Admin Check (Copyright)</span>
          </div>
          <div className="flex items-center">
            <span className={`mr-2 w-6 h-6 flex items-center justify-center rounded border ${scorecard.wordCount <= 750 ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-red-50 border-red-200 text-red-600'}`}>
               <i className="fas fa-calculator text-xs"></i>
            </span>
            <span className="text-gray-700 text-sm">Length: {scorecard.wordCount} / 750 max</span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">Readiness Rating:</span>
            <span className={`px-4 py-1 rounded-full text-sm font-bold border ${getRatingColor(rating)}`}>
              {rating}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
