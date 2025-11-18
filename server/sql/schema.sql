-- PostgreSQL schema for JobSpeedy AI auth separation

create table if not exists admin_users (
  id serial primary key,
  email text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id serial primary key,
  full_name text not null,
  email text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- Add phone column to users table
alter table users add column if not exists phone text;

-- Jobs table for job postings
create table if not exists jobs (
  id serial primary key,
  title text not null,
  department text not null,
  description text,
  requirements text[] default array[]::text[],
  status text not null default 'Open',
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Applications table linking users with jobs
create table if not exists applications (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  job_id integer not null references jobs(id) on delete cascade,
  resume_url text,
  cover_letter text,
  status text not null default 'Pending',
  ai_parsed_data jsonb,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, job_id)
);

-- Add binary resume storage columns to applications table
alter table applications add column if not exists resume_filename text;
alter table applications add column if not exists resume_mime text;
alter table applications add column if not exists resume_data bytea;

-- Indexes for better query performance
create index if not exists idx_applications_user_id on applications(user_id);
create index if not exists idx_applications_job_id on applications(job_id);
create index if not exists idx_applications_status on applications(status);
create index if not exists idx_jobs_status on jobs(status);

-- Clients table (Company directory)
create table if not exists clients (
  id serial primary key,
  company text unique not null,
  contact_person text,
  email text,
  created_at timestamptz not null default now()
);

-- Optional: add client_id to jobs and backfill by company name
alter table jobs add column if not exists client_id integer;
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'jobs_client_id_fkey'
  ) then
    alter table jobs
      add constraint jobs_client_id_fkey
      foreign key (client_id) references clients(id) on delete set null;
  end if;
end $$;

-- Backfill helper (run separately after inserting clients):
-- update jobs j set client_id = c.id from clients c where j.company = c.company and j.client_id is null;

-- Seed one admin and one user (change hashes accordingly if needed)
-- password for both below is: Password123!
insert into admin_users (email, password_hash)
values ('admin@example.com', '$2a$10$8Z8m8s9wQ3mQfQO1Yd8g2eIxm5Sg7xQd8xO1U7jE1m2jL0GmTqv8i')
on conflict (email) do nothing;

insert into users (full_name, email, password_hash)
values ('John Doe', 'john@example.com', '$2a$10$8Z8m8s9wQ3mQfQO1Yd8g2eIxm5Sg7xQd8xO1U7jE1m2jL0GmTqv8i')
on conflict (email) do nothing;

-- Seed sample users (candidates)
insert into users (full_name, email, password_hash)
values 
  ('Alice Johnson', 'alice.johnson@example.com', '$2a$10$8Z8m8s9wQ3mQfQO1Yd8g2eIxm5Sg7xQd8xO1U7jE1m2jL0GmTqv8i'),
  ('Bob Smith', 'bob.smith@example.com', '$2a$10$8Z8m8s9wQ3mQfQO1Yd8g2eIxm5Sg7xQd8xO1U7jE1m2jL0GmTqv8i'),
  ('Charlie Brown', 'charlie.brown@example.com', '$2a$10$8Z8m8s9wQ3mQfQO1Yd8g2eIxm5Sg7xQd8xO1U7jE1m2jL0GmTqv8i'),
  ('Diana Prince', 'diana.prince@example.com', '$2a$10$8Z8m8s9wQ3mQfQO1Yd8g2eIxm5Sg7xQd8xO1U7jE1m2jL0GmTqv8i')
on conflict (email) do nothing;

-- Seed sample jobs
insert into jobs (title, department, description, requirements, status, created_by)
values 
  ('Senior React Developer', 'IT', 'Looking for an experienced React developer', array['React', 'JavaScript', 'TypeScript', '5+ years'], 'Open', 'Admin'),
  ('Nurse', 'Healthcare', 'Registered nurse position', array['RN License', 'CPR Certified', '3+ years'], 'Open', 'Admin'),
  ('Full Stack Developer', 'IT', 'Full stack developer with Node.js experience', array['Node.js', 'React', 'PostgreSQL', '4+ years'], 'Open', 'Admin'),
  ('Frontend Developer', 'IT', 'Frontend developer position', array['Vue.js', 'JavaScript', 'HTML/CSS', '2+ years'], 'Closed', 'Admin')
on conflict do nothing;

-- Seed sample applications
-- Note: This assumes users table has been seeded with the above users
insert into applications (user_id, job_id, resume_url, cover_letter, status, ai_parsed_data, admin_notes)
select 
  u.id as user_id,
  j.id as job_id,
  'https://example.com/resumes/' || lower(replace(u.full_name, ' ', '_')) || '.pdf' as resume_url,
  'I am very interested in this position...' as cover_letter,
  case when row_number() over (partition by u.id) <= 2 then 'Pending' else 'Shortlisted' end as status,
  jsonb_build_object(
    'skills', array['React', 'Node.js', 'JavaScript'],
    'experience_years', 5,
    'education', 'Bachelor in Computer Science',
    'summary', 'Experienced developer with strong skills'
  ) as ai_parsed_data,
  'Good candidate for this role' as admin_notes
from users u
cross join jobs j
where u.email like '%@example.com' and j.status = 'Open' and (j.id % 2 = 0 or u.id % 2 = 0)
on conflict do nothing;


