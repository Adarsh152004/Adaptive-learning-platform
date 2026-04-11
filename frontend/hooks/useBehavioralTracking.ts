"use client";

import { useEffect, useRef } from "react";
import axios from "axios";

export function useBehavioralTracking(userId: string) {
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // 1. Log Login/Entry
    const logLogin = async () => {
      try {
        await axios.post("http://localhost:8001/api/mindguard/activity", {
          user_id: userId,
          activity_type: "session_start",
          duration: 0,
        });
      } catch (err) {
        console.error("Failed to log activity", err);
      }
    };

    logLogin();

    // 2. Track duration on unmount
    return () => {
      const endTime = Date.now();
      const durationSeconds = Math.floor((endTime - startTimeRef.current) / 1000);
      
      // Use navigator.sendBeacon for reliable logging on close
      const url = "http://localhost:8001/api/mindguard/activity";
      const data = JSON.stringify({
        user_id: userId,
        activity_type: "study_session",
        duration: durationSeconds,
      });
      
      // Since sendBeacon is a bit tricky with JSON headers in some environments, 
      // we'll try a standard fetch/beacon approach
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          const blob = new Blob([data], { type: 'application/json' });
          navigator.sendBeacon(url, blob);
      }
    };
  }, [userId]);

  const logActivity = async (type: string, duration: number = 0) => {
    try {
      await axios.post("http://localhost:8001/api/mindguard/activity", {
        user_id: userId,
        activity_type: type,
        duration: duration,
      });
    } catch (err) {
      console.error("Failed to log custom activity", err);
    }
  };

  return { logActivity };
}
