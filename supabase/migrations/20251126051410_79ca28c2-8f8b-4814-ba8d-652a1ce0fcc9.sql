-- Create enum for player roles
CREATE TYPE player_role AS ENUM ('bat', 'ball', 'wk', 'all-rounder');

-- Create storage buckets for player images and ID proofs
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('player-images', 'player-images', true),
  ('id-proofs', 'id-proofs', true);

-- Create players table
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  role player_role NOT NULL,
  image_url TEXT,
  place TEXT NOT NULL,
  id_proof_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_contact TEXT NOT NULL,
  owner_details TEXT,
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table for team players
CREATE TABLE public.team_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, player_id)
);

-- Enable Row Level Security
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_players ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (registration system)
CREATE POLICY "Anyone can view players" 
ON public.players 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create players" 
ON public.players 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view teams" 
ON public.teams 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create teams" 
ON public.teams 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update teams" 
ON public.teams 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can view team players" 
ON public.team_players 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can manage team players" 
ON public.team_players 
FOR INSERT 
WITH CHECK (true);

-- Storage policies for player images
CREATE POLICY "Anyone can view player images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'player-images');

CREATE POLICY "Anyone can upload player images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'player-images');

-- Storage policies for ID proofs
CREATE POLICY "Anyone can view ID proofs" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'id-proofs');

CREATE POLICY "Anyone can upload ID proofs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'id-proofs');