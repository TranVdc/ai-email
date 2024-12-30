"use client";
import React from "react";
import { Button } from "./ui/button";
import { getAurinkoAuthorizationUrl } from "@/lib/aurinko";

const LinkAccountBUtton = () => {
  const handleClick = async () => {
    try {
      const authUrl = await getAurinkoAuthorizationUrl("Office365");
      window.location.href = authUrl;
    } catch (error) {
      console.error("Error getting authorization URL:", error);
    }
  };

  return <Button onClick={handleClick}>Link Account</Button>;
};

export default LinkAccountBUtton;
