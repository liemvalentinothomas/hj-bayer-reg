'use client';
import {useEffect} from 'react';
import {receiptKey,pendingKey} from '@/lib/receipts';
export default function EventEntry({slug}:{slug:string}){useEffect(()=>{try{if(localStorage.getItem(receiptKey(slug))||localStorage.getItem(pendingKey(slug)))window.location.replace('/events/'+slug+'/register');}catch{}},[slug]);return null;}
