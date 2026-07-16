import { InputHTMLAttributes } from 'react';

export function SearchInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="search"
      className="block w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      {...props}
    />
  );
}
