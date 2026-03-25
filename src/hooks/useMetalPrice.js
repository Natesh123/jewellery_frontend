import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "https://r9kj46l6-5000.inc1.devtunnels.ms";

// const SOCKET_URL = "http://190.92.175.165:5000";


export default function useMetalPrices() {
    const [prices, setPrices] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);

    useEffect(() => {
       

        const socket = io(SOCKET_URL, {
            transports: ["websocket", "polling"],
        });

        socket.on("connect", () => {
            console.log("✅ Connected to socket:", socket.id);
            setIsConnected(true);
            setConnectionError(null);
        });

        socket.on("metalPrices", (data) => {
           
            setPrices(data);
        });

        socket.on("disconnect", (reason) => {
            console.log("❌ Disconnected from socket. Reason:", reason);
            setIsConnected(false);
        });

        socket.on("connect_error", (error) => {
            console.error("Connection error:", error);
            setConnectionError(error.message);
            setIsConnected(false);

            // Try fallback to polling if websocket fails
            if (socket.io.opts.transports[0] === 'websocket') {
                socket.io.opts.transports = ['polling', 'websocket'];
            }
        });

        socket.on("error", (error) => {
            console.error("Socket error:", error);
            setConnectionError(error.message);
        });

        // Test connection on mount
        socket.connect();

        return () => {
            
            socket.removeAllListeners();
            socket.disconnect();
        };
    }, []);
    if(prices.length!==3){
        return []
    }
    console.log(prices)
    return prices;
}