import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import type { SupportTicket, TicketReply } from '@/services/supportTicketApi';

type State = {
  tickets: SupportTicket[];
  selectedTicket: SupportTicket | null;
};

type Action =
  | { type: 'SET_TICKETS'; payload: SupportTicket[] }
  | { type: 'SET_SELECTED_TICKET'; payload: SupportTicket | null }
  | { type: 'UPDATE_TICKET'; payload: SupportTicket }
  | { type: 'APPEND_REPLY'; payload: { ticketId: number; reply: TicketReply } };

const STORAGE_KEY = 'support_tickets_store';

const initialState: State = { tickets: [], selectedTicket: null };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_TICKETS':
      return { ...state, tickets: action.payload };
    case 'SET_SELECTED_TICKET':
      return { ...state, selectedTicket: action.payload };
    case 'UPDATE_TICKET': {
      const updated = action.payload;
      const tickets = state.tickets.map(t => (t.id === updated.id ? { ...t, ...updated } : t));
      const selectedTicket = state.selectedTicket && state.selectedTicket.id === updated.id
        ? { ...state.selectedTicket, ...updated }
        : state.selectedTicket;
      return { ...state, tickets, selectedTicket };
    }
    case 'APPEND_REPLY': {
      const { ticketId, reply } = action.payload;
      const tickets = state.tickets.map(t => (
        t.id === ticketId ? { ...t, replies: [ ...(t.replies || []), reply ] } : t
      ));
      const selectedTicket = state.selectedTicket && state.selectedTicket.id === ticketId
        ? { ...state.selectedTicket, replies: [ ...(state.selectedTicket.replies || []), reply ] }
        : state.selectedTicket;
      return { ...state, tickets, selectedTicket };
    }
    default:
      return state;
  }
}

const SupportTicketsContext = createContext<{
  tickets: SupportTicket[];
  selectedTicket: SupportTicket | null;
  setTickets: (tickets: SupportTicket[]) => void;
  setSelectedTicket: (ticket: SupportTicket | null) => void;
  updateTicket: (ticket: SupportTicket) => void;
  appendReply: (ticketId: number, reply: TicketReply) => void;
} | null>(null);

export const SupportTicketsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const persisted = useMemo(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as State;
    } catch (_) {}
    return initialState;
  }, []);

  const [state, dispatch] = useReducer(reducer, persisted);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }, [state]);

  const value = useMemo(() => ({
    tickets: state.tickets,
    selectedTicket: state.selectedTicket,
    setTickets: (tickets: SupportTicket[]) => dispatch({ type: 'SET_TICKETS', payload: tickets }),
    setSelectedTicket: (ticket: SupportTicket | null) => dispatch({ type: 'SET_SELECTED_TICKET', payload: ticket }),
    updateTicket: (ticket: SupportTicket) => dispatch({ type: 'UPDATE_TICKET', payload: ticket }),
    appendReply: (ticketId: number, reply: TicketReply) => dispatch({ type: 'APPEND_REPLY', payload: { ticketId, reply } }),
  }), [state]);

  return (
    <SupportTicketsContext.Provider value={value}>{children}</SupportTicketsContext.Provider>
  );
};

export function useSupportTickets() {
  const ctx = useContext(SupportTicketsContext);
  if (!ctx) throw new Error('useSupportTickets must be used within SupportTicketsProvider');
  return ctx;
}


