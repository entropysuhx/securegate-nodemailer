# SecureGate — Reflection & Engineering Analysis

**Name:** Sirinada Kanyawimon
**Cohort:** Design to MVP Bootcamp
**Live URL:** https://securegate-mu.vercel.app/login
**GitHub Repo:** https://github.com/entropysuhx/securegate

Note: Resend is now using temporary/testing sender mode for development, so it can only send email to verified/registered emails. Email verification, login, signup, forget password, reset password all working fine when tested with my registered email. It also fail correctly after multiple wrong attempts.

For public email sending, it will need verified custom domain in production.
I also attached my screen recording below with Google Drive link for proof/testing.

**Screen Record Video:** https://drive.google.com/file/d/1GkTakc1r5GPkZDAE_v33l5fXYCV2gq_O/view?usp=sharing


## Part 1 — What I Built

I built SecureGate, an authentication and security web app where users can create account and login with username and password. Before login, users need to verify email first. The app also have forgot password and reset password feature using email link. It also blocks login after 5 failed attempts for 10 minutes.

Besides the features from instruction file, I also added password generator, delete account feature, and password guide to help users create stronger password.
 
## Part 2 — What Surprised Me

What surprised me the most was how many small problems happened during the project. I had issues with Prisma, Vercel deployment, environment variables, and wrong folder structure. Sometimes the app failed many times even though it worked fine on localhost.

I also learned that authentication systems have many things to handle, not just login and signup. I needed to handle expired links, wrong password attempts, protected pages, and password reset flow. This project made me realize security systems are more complicated than they look.

One real problem I faced was during deployment. The app worked on localhost, but Vercel kept failing because Prisma was not generating correctly during the build process.

Another problem was the folder structure. I accidentally had nested folders, which made Vercel deploy the wrong app and show the default Next.js page instead of my actual SecureGate login UI.

## Part 3 — Engineering Laws Quiz

### Q1 —  Where in SecureGate did Murphy's Law force you to add protection you would not have thought about otherwise? Name at least two specific places and explain what could have gone wrong

**Code reference:** src/lib/ratelimit.ts from line 9, 17, 25

**My Answer:** Murphy’s Law happened a lot during this project because many small things can break authentication systems.

One example is login rate limiting in src/lib/ratelimit.ts. Without it, people can keep trying many passwords until they guess the correct one. I added protection to block login after too many wrong attempts.

Another example is email verification and reset password links. I added token expiration check because old links should not work forever. During testing, I changed the token expiration in Supabase to test expired links and resend email flow.

I also had real problems during deployment. The app worked on localhost but failed on Vercel because of wrong environment variables, Prisma build problems, and wrong folder structure.

**What goes wrong if ignored:** Without rate limiting, attackers can brute-force passwords. Without token expiration, old reset or verification links can still be used later. Wrong deployment settings can also break the whole authentication system.

### Q2 — NextAuth, Prisma, and Resend are all abstractions. Pick one and explain where it 'leaks' — where you had to understand the layer beneath it to make something work correctly.

**Code reference:** src/lib/email.ts src/app/api/verify-email/route.ts, src/app/api/auth/signup/route.ts

**My Answer:** I think Resend is one example where the abstraction leaks. Even though Resend makes sending emails easier, I still needed to understand how the email verification flow works underneath.

For example, I needed to understand how verification links, tokens, redirects, and expiration work between the frontend, backend, and database. During testing, I changed the token expiration settings in Supabase to test expired links and the resend email flow correctly.

**What goes wrong if ignored:** If I only trusted the abstraction without understanding the logic underneath, verification emails or reset password links could break, expire incorrectly, or send users to the wrong pages. This could make users unable to verify accounts or reset passwords correctly.

###  Q3 — SecureGate intentionally does not have social login, multi-factor auth, or audit logs. Explain why adding those features right now would violate YAGNI, and how you would add them correctly later.

**Code reference:** prisma/schema.prisma

**My Answer:** I think adding social login, multi-factor authentication, and audit logs right now would violate YAGNI because the project only needs a secure email and password authentication system. Adding too many advanced features too early would make the project more complicated and harder to debug.

**What goes wrong if ignored:** If I add too many features too early, the project can become harder to maintain, debug, and deploy. More features also mean more possible bugs and security problems before the core authentication system is fully stable.

###  Q4 — Look at your password hashing implementation. What is a salt, why does bcrypt use it automatically, and what would happen to your users if you stored SHA-256 hashes instead?

**Code reference:** src/app/api/auth/signup/route.ts line 53, src/app/api/auth/reset-password/route.ts line 42, securegate/src/lib/auth.ts line 53

**My Answer:** A salt is random data added to a password before hashing it. Bcrypt does this automatically to make passwords safer. Even if two users use the same password their saved password hashes will still look different in the database.

If I used normal SHA-256 hashing only attackers could guess passwords much faster if the database leaked because SHA-256 is fast and does not protect passwords as well as bcrypt.

**What goes wrong if ignored:** Without salt and bcrypt, weak passwords would be much easier to crack if hackers got access to the database.

###  Q5 — Your forgot-password endpoint returns a success message even if the email does not exist. Why? What law or principle governs this decision, and what would happen to user privacy if you changed it?

**Code reference:**  src/app/api/auth/forgot-password/route.ts line 37-58

**My Answer:** The forgot password feature gives the same success message even if the email does not exist. This follows Postel’s Law and security best practices to protect user privacy and security.

The app handles the request normally and does not reveal if an email is registered or not. If it says “email not found” attackers could test many emails and discover which accounts exist in the system.

Because of this the app always shows the same success message so nobody can know if the email exists or not.

**What goes wrong if ignored:** If the app shows different messages for existing and non-existing emails, hackers could collect real user emails from the system which is a privacy and security risk.

###  Q6 —  Find one place in your codebase where you applied the Boy Scout Rule — where you cleaned up something that was not part of your original plan. What did you find? What did you fix?

**Code reference:**  src/app/page.tsx (I added code to make it redirect to the login) 

**My Answer:** One place where I used the Boy Scout Rule was during deployment and cleanup. At first I had wrong folder structure and nested folders so Vercel deployed the wrong app and showed the default Next.js page instead of my SecureGate UI.

While fixing the problem, I also cleaned up the project by deleting unused folders and fixing the homepage redirect in src/app/page.tsx so users go directly to login page.

**What goes wrong if ignored:** If I ignore these cleanup problems deployment can keep failing or show wrong page, making the app confusing.


###  Q7 —  Your SecureGate started as a scaffold and grew phase by phase. How does this match Gall's Law? What would have happened if you tried to build all six phases at the same time?

**Code reference:**  CONTEXT.md line (line 9 - 127)

**My Answer:** SecureGate matches Gall’s Law because the project started from a simple working system first, then slowly grew phase by phase. Each phase needed to work first before moving to the next one.

First Ifocused on basic authentication then added email verification, reset password, rate limiting, deployment and other security features later.

This made debugging easier because I could test one part at a time instead of fixing everything together.

**What goes wrong if ignored:** If I tried building all phases at the same time, the project would become confusing and hard to debug. And allow me to test out during each phase end. The app already have many parts like database, email, tokens, sessions, and deployment so it would be hard to know which part caused the problem when something failed.


###  Q8 —  You built SecureGate using Prisma to talk to PostgreSQL. Identify one situation where the Prisma schema model and the actual database table structure are NOT the same thing. Why does this matter?

**Code reference:**  securegate/prisma/schema.prisma

**My Answer:** Prisma is like a translator between my app and PostgreSQL database. The Prisma schema looks simple and easy to read, but the real database works differently behind the scenes.

One example is this: id String @id @default(cuid())

It looks like the database makes the ID automatically but actually Prisma makes the ID first before saving it into PostgreSQL.

**What goes wrong if ignored:** If I think Prisma and PostgreSQL work exactly the same, it can cause database errors, broken table relations, or authentication problems.

###  Q9 —  Rate limiting is not in the core Next.js or NextAuth package. You had to add it yourself. What software engineering principle does this demonstrate, and how would Zawinski's Law warn you about what happens when apps grow without discipline?

**Code reference:**  src/lib/ratelimit.ts, src/lib/auth.ts (line 32-35), src/app/api/auth/signup/route.ts (line 5-24) and src/app/api/auth/forgot-password/route.ts (line 18-27)

**My Answer:** Rate limiting is not included in Next.js or NextAuth so I needed to make it myself. This shows sometimes developers need to add extra security features because the default system does not have everything.

I added rate limiting to stop people from trying too many wrong passwords.

Zawinski’s Law says apps can become too complicated if developers keep adding too many features without good planning. During this project I learned authentication systems already have many parts like database, email, tokens, sessions, and deployment.

**What goes wrong if ignored:** Without good planning, the app can become messy, harder to debug, and easier to break when adding more features.

###  Q10 —  Your login form shows an error message when credentials are wrong. What exact message do you show, and why did you choose that specific wording? What would the Principle of Least Surprise say about how error messages should behave?

**Code reference:**  src/app/(auth)/login/page.tsx (from line 9)

**My Answer:** At first, the login form showed the error message "CredentialsSignin" but this was confusing because normal users would not understand what it means.

So I changed it to Invalid email or password because it is simple, clear, and easier to understand.

This follows the Principle of Least Surprise because users should quickly understand what went wrong without seeing technical system messages.

**What goes wrong if ignored:** If apps show technical error messages, users can get confused and think the system is broken. It can also make the app feel less user-friendly.

###  Q11 —   Look at your /dashboard route protection. How does your middleware know the user is authenticated? If a user manually deletes their session cookie, what happens? Trace the exact code path.

**Code reference:**  src/middleware.ts

**My Answer:** 

The /dashboard page is protected using NextAuth middleware in src/middleware.ts.

When users log in, NextAuth creates a session cookie in the browser. The middleware checks this cookie to know if the user is logged in or not. If the cookie is valid, the user can access /dashboard.

If the user deletes the session cookie manually, the middleware cannot find the login session anymore. Because of this, the user is automatically redirected back to the /login page.

The flow is: User opens dashboard > middleware checks session cookie > cookie missing > authentication fails > redirect to /login.

**What goes wrong if ignored:** Without route protection, users could access protected pages without logging in, which is a security problem.

###  Q12 — You used environment variables to store secrets. Explain what would happen — step by step — if your NEXTAUTH_SECRET was accidentally committed to GitHub and how you would recover from it.

**Code reference:**  .env, .env.local, .gitignore

**My Answer:** 

Environment variables are used to store secret information like NEXTAUTH_SECRET and database URLs. In this project, .env.local is added to .gitignore so secret files do not get uploaded to GitHub.

If NEXTAUTH_SECRET was accidentally uploaded to GitHub, hackers could use it to create fake login sessions or access user accounts.

To fix this, I would:

1. Remove the secret from GitHub
2. Make a new NEXTAUTH_SECRET
3. Update the new secret in .env.local and Vercel environment variables
4. Redeploy the app so old sessions stop working

**What goes wrong if ignored:** If the leaked secret is not changed hackers could fake login sessions and access accounts without permission.

###  Q13 — SecureGate required you to write code across routes, middleware, database schema, and email templates. How does Conway's Law explain why full-stack developers organise code the way they do? How is your folder structure are flection of how you think

**Code reference:**  CONTEXT.md line (line 164 - 208)

**My Answer:** 

Conway’s Law means software structure usually matches how developers think and work.

Since I built SecureGate as a full-stack project I organized the folders by features and user flow like /login, /signup, and /dashboard.

I put shared logic like email, Prisma, and tokens inside lib/. Database structure is inside prisma/, and middleware.ts handles route protection.

The folder structure reflects how I think about the app because everything is grouped by user actions and how the authentication system works together.

**What goes wrong if ignored:** Without good folder structure, the project can become messy, confusing, and harder to debug later.

###  Q14 —  Identify one piece of technical debt in your SecureGate codebase — something that works right now but will cause problems when the app grows. Describe the debt precisely, explain why you left it, and write the refactored version.

**Code reference:**  src/app/api/auth/delete-account/route.ts

**My Answer:** One technical debt in SecureGate was account deletion cleanup. At first when users deleted their account only the user account was deleted. The old verification tokens and reset password tokens were still left in the database.

I left it like that first because I wanted to focus on making the main authentication system work before improving database cleanup. Then I fixed it using prisma.$transaction so the app deletes the account and related tokens together.

**What goes wrong if ignored:** If ignored, the database can slowly collect unused token records and become more messy over time.


###  Q15 —   If you were asked to add Flutterwave payment integration to SecureGate — so users pay to unlock a premium dashboard — walk through every engineering principle from this task that would still apply. Which ones become more critical when money is involved?

**My Answer:** If I added Flutterwave payment integration to SecureGate, many engineering principles from this project would still apply but become more important because real money is involved.

Murphy’s Law still matters because payment systems can fail, users can refresh pages, payments can timeout, or webhooks can break. I would need to handle failed payments and unexpected errors carefully.

Gall’s Law because I should first build a simple working payment flow before adding advanced features like subscriptions or invoices.

YAGNI also matters because adding too many payment features too early can make the app harder to manage and debug.

Security becomes much more important when money is involved. Things like environment variables, protected routes, token handling, and rate limiting need extra protection because payment systems are common targets for attackers.

Postel’s Law and the Principle of Least Surprise also matter because payment messages and errors should be simple and easy for users to understand.

**What goes wrong if ignored:** If these principles are ignored, the payment system can become insecure, confusing, easier to abuse and much harder to debug.
