import { Link } from 'react-router-dom';

export const ToolCard = ({ tool }) => (
    <Link
        to={tool.to}
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md"
    >
        <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-purple-50 text-purple-600">
            <tool.icon size={22} />
        </div>
        <h3 className="font-semibold text-gray-900">{tool.title}</h3>
        <p className="mt-1 text-sm text-gray-500">{tool.description}</p>
    </Link>
);

export const ToolSection = ({ title, children }) => (
    <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
);
