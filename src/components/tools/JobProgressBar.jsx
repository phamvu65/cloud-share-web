const JobProgressBar = ({ label, progress }) => {
    const pct = Math.min(100, Math.max(0, Math.round(progress)));
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
                <span>{label}</span>
                <span className="font-semibold text-purple-600">{pct}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                    className="h-full rounded-full bg-purple-600 transition-all duration-300 ease-out"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
};

export default JobProgressBar;
