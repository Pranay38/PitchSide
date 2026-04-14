import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Headphones } from "lucide-react";

interface TouchlineAudioPlayerProps {
    audioUrl: string;
    title?: string;
}

export function TouchlineAudioPlayer({ audioUrl, title = "Touchline Audio Breakdown" }: TouchlineAudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateProgress = () => {
            if (audio.duration) {
                setProgress((audio.currentTime / audio.duration) * 100);
            }
        };

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setProgress(0);
        };

        audio.addEventListener("timeupdate", updateProgress);
        audio.addEventListener("loadedmetadata", handleLoadedMetadata);
        audio.addEventListener("ended", handleEnded);

        return () => {
            audio.removeEventListener("timeupdate", updateProgress);
            audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
            audio.removeEventListener("ended", handleEnded);
        };
    }, []);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
        if (!audioRef.current) return;
        audioRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!audioRef.current) return;
        const seekTime = (Number(e.target.value) / 100) * audioRef.current.duration;
        audioRef.current.currentTime = seekTime;
        setProgress(Number(e.target.value));
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    if (!audioUrl) return null;

    return (
        <div className="my-8 rounded-2xl bg-[#0F172A] border border-[#1E293B] shadow-xl overflow-hidden p-5 md:p-6 flex flex-col md:flex-row items-center gap-5 md:gap-6 relative group">
            {/* Background Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#16A34A]/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <audio ref={audioRef} src={audioUrl} preload="metadata" />

            <button
                onClick={togglePlay}
                className="w-14 h-14 shrink-0 rounded-full bg-[#16A34A] text-white flex justify-center items-center hover:scale-105 transition-transform"
            >
                {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-1" />}
            </button>

            <div className="flex-1 w-full space-y-3 z-10">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Headphones className="w-4 h-4 text-[#16A34A]" />
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h4>
                    </div>
                    <span className="text-xs font-mono text-gray-400">
                        {formatTime(audioRef.current?.currentTime || 0)} / {formatTime(duration)}
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={handleSeek}
                        className="w-full h-1.5 bg-[#1E293B] rounded-lg appearance-none cursor-pointer accent-[#16A34A]"
                    />
                    <button onClick={toggleMute} className="text-gray-400 hover:text-white transition-colors">
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                </div>
            </div>
            
            {/* Visualizer bars placeholder */}
            <div className="hidden md:flex items-center gap-1 opacity-50 px-2 pointer-events-none">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div 
                        key={i} 
                        className={`w-1 rounded-full bg-[#16A34A] ${isPlaying ? 'animate-pulse' : ''}`}
                        style={{ height: `${Math.random() * 24 + 8}px`, animationDelay: `${i * 0.1}s` }}
                    ></div>
                ))}
            </div>
        </div>
    );
}
