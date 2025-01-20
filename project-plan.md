# Project Plan: AI for Children's Book Recommendations

## Introduction
This project is a 30-credit master's thesis project. It involves developing a website that uses artificial intelligence to help children find suitable books. The website asks users several questions about their interests, what kinds of books they have read before, and how they liked them. Based on the answers, an AI model will formulate additional questions to better understand the user. After these questions are answered, the website displays book recommendations. The website will be built using Next.js with Tailwind, PostgreSQL, Redis, and Shadcn. Data will be scraped from Forlagid's website to build a database of children's and young adult books. For AI functionality, we will use Anthropic Claude's web service along with the Pinecone API. The thesis is due May 5, 2025. Period: January 20 - May 5, 2025 (15 weeks).

## 1. Preparation Phase (2 weeks: January 20-31)

### Research and Analysis
- Conduct a brief but focused analysis of similar solutions
  - Examine RAG implementations and solutions (particularly focus on how people have used Pinecone for this).
- Define target audience and user groups precisely
  - Children aged 5-10 years.
- Clearly define project scope and set realistic goals
- Define research question
  - Can artificial intelligence help children find suitable books?
- Determine exactly what data needs to be collected
  - Scrape everything from Forlagid and then filter out books that don't fit the age group (if possible).

### Technical Setup
- Set up development environment (Next.js, PostgreSQL, Redis)
- Test connections to Anthropic Claude and Pinecone API
- Set up Git repository and CI/CD processes

### Stretch Goal
Complete data scraping and set it up as an independent project.

## 2. Data Collection and Processing (2 weeks: February 1-14)

### Data Collection and Database Design
- Develop and run web scraper for forlagid.is
- Design and set up database
  - One wide table where records are books and columns are information about them, such as metadata.
- Clean data and add necessary metadata
- Set up basic tables for user information
  - Only user tables to collect information about users
- Set up thesis structure in Overleaf and note points in each subsection to shape what will be discussed in each chapter.

## 3. Interface Design and Prototype (2 weeks: February 15-28)

### Design and Prototypes
- Design user flow and question process
  - Also design front page text explaining this is a research project and data is collected anonymously
  - Also need to consider the process after finding a book where the user is asked several questions including something that helps answer the main research question.
- Create wireframes for key pages
- Implement high-fidelity prototype
- Conduct rapid user testing on prototype

## 4. Programming (5 weeks: March 1 - April 4)

### First Phase (2 weeks)
- Set up basic pages and navigation system
- Implement user interface for question process
- Set up basic functionality for book search

### Second Phase (2 weeks)
- Connect to Claude API for question selection
- Implement book recommendation functionality
- Connect to Pinecone for semantic search

### Third Phase (1 week)
- Implement caching with Redis
- Improve error handling
- Fine-tune performance

## 5. Testing and Fixes (1 week: April 5-11)
- Perform unit tests on key functionality
- User testing with 3-5 users
- Fix obvious errors and problems
- Fine-tune AI responses

## 6. Thesis Writing and Documentation (3 weeks: April 12-30)

### First Week
- Write theoretical background
- Describe design and implementation

### Second Week
- Write about results and testing
- Write discussion and conclusions
- Write introduction chapter

### Third Week
- Final editing and proofreading
- Submit thesis and project

## Key Milestones
1. Preparation completed: January 31
2. Database ready: February 14
3. Interface design completed: February 28
4. Basic functionality programmed: April 4
5. Testing and fixes: April 11
6. Thesis submission: May 5

## Risk Factors and Responses

### 1. Time Risk
- Simplify complexity if needed
- Prioritize key features
- Have contingency plan for each phase

### 2. Technical Risk
- Start early testing of API connections
- Have simple fallback solution for recommendation system
- Limit dataset scope if needed

### 3. Quality Risk
- Define minimum requirements early
- Conduct regular testing
- Have clear criteria for acceptable functionality

## Workload
Based on 30 ECTS credits, the workload should be about 50 hours per week. The distribution could be:
- Monday-Friday: 8-9 hours per day
- Weekends: 5-7 hours per day
- Total: 50-52 hours per week
