import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, FileText, Users, Settings, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
}

interface CommandItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    action: () => void;
    category: string;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const commands: CommandItem[] = [
        {
            id: 'dashboard',
            label: 'Go to Dashboard',
            icon: <FileText className="h-4 w-4" />,
            action: () => {
                // Navigate based on user role
                onClose();
            },
            category: 'Navigation'
        },
        {
            id: 'exams',
            label: 'Manage Exams',
            icon: <FileText className="h-4 w-4" />,
            action: () => {
                // Navigate to exams
                onClose();
            },
            category: 'Navigation'
        },
        {
            id: 'users',
            label: 'Manage Users',
            icon: <Users className="h-4 w-4" />,
            action: () => {
                // Navigate to users
                onClose();
            },
            category: 'Navigation'
        },
        {
            id: 'settings',
            label: 'Settings',
            icon: <Settings className="h-4 w-4" />,
            action: () => {
                // Navigate to settings
                onClose();
            },
            category: 'Actions'
        },
        {
            id: 'logout',
            label: 'Logout',
            icon: <LogOut className="h-4 w-4" />,
            action: () => {
                // Handle logout
                onClose();
            },
            category: 'Actions'
        }
    ];

    const filteredCommands = commands.filter(command =>
        command.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev => 
                        prev < filteredCommands.length - 1 ? prev + 1 : 0
                    );
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev => 
                        prev > 0 ? prev - 1 : filteredCommands.length - 1
                    );
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (filteredCommands[selectedIndex]) {
                        filteredCommands[selectedIndex].action();
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedIndex, filteredCommands]);

    const handleCommandClick = (command: CommandItem) => {
        command.action();
    };

    const groupedCommands = filteredCommands.reduce((acc, command) => {
        if (!acc[command.category]) {
            acc[command.category] = [];
        }
        acc[command.category].push(command);
        return acc;
    }, {} as Record<string, CommandItem[]>);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[20vh]"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center space-x-3">
                                <Command className="h-5 w-5 text-gray-400" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Type a command or search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="flex-1 outline-none text-gray-900 placeholder-gray-500"
                                />
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {Object.entries(groupedCommands).map(([category, commands]) => (
                                <div key={category} className="border-b border-gray-100 last:border-b-0">
                                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        {category}
                                    </div>
                                    {commands.map((command, index) => {
                                        const actualIndex = filteredCommands.indexOf(command);
                                        return (
                                            <motion.button
                                                key={command.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className={`w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors text-left ${
                                                    actualIndex === selectedIndex 
                                                        ? 'bg-blue-50 text-blue-600' 
                                                        : 'text-gray-700'
                                                }`}
                                                onClick={() => handleCommandClick(command)}
                                            >
                                                {command.icon}
                                                <span className="flex-1">{command.label}</span>
                                                <kbd className="px-2 py-1 text-xs bg-gray-100 border border-gray-200 rounded">
                                                    {actualIndex === selectedIndex ? 'Enter' : '→'}
                                                </kbd>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>

                        {filteredCommands.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                                <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p>No commands found</p>
                                <p className="text-sm mt-2">Try different keywords</p>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CommandPalette;
