"use client"

import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export function Calendar(props: any) {
  return (
    <>
      <style jsx global>{`
        .rdp table, .rdp tr, .rdp td, .rdp th {
          display: revert !important;
        }
      `}</style>
      <DayPicker {...props} />
    </>
  );
}

