/**
 * Traduction anglaise des messages aux membres — POUR INFORMATION UNIQUEMENT.
 * L'agent SAV est anglophone : la traduction s'affiche à côté du message français pour qu'il
 * comprenne ce qu'il envoie. Seul le message français est copié et envoyé au membre.
 *
 * Règle : même découpage en paragraphes que le texte source (séparés par une ligne vide), pour
 * que chaque paragraphe anglais s'aligne en face de son équivalent français (testé).
 * « INVOICE LINK » correspond à la mention « LIEN DE L'INVOICE » du texte source.
 */
export const templatesEnglish: Record<string, string> = {
  'tpl-sav-nouvel-ecosysteme': `Hello 👋

We've been working hard behind the scenes to prepare something much bigger for you, and we're thrilled to announce that the new ECC ecosystem is officially live.
A new platform, an experience redesigned from A to Z, and everything you need to reach the next level with us.

What actually changes:
The community is moving to Circle — more powerful, smoother, more professional
The new course is now available on Whop
Everything brought together in a single ecosystem: the Ecommerce Capital Club

👉 Just one step to join V2:
Complete the KYC (identity verification) using the form below.
This step is required to validate your new access and receive your ECC member card:

🔗 https://membres.ecommercecapitalclub.com/

Once validated, your access to Circle, Whop and the whole new ecosystem will be unlocked quickly.

If you have any questions during the process, don't hesitate to get back to us.

We can't wait to see you on the other side 🔥

See you very soon,

The Ecommerce Capital Club team`,

  'tpl-sav-client-non-identifie': `Hello 👋

To quickly look into your situation and find you an effective solution, I need you to confirm the following information:

- Email used at sign-up:

- Last name / First name:

- Discord username:

- Precise description of the problem:

- KYC completed: (Yes / No)

- Access to Circle: (Yes / No)

- Access to Whop: (Yes / No)

- ECC card validated: (Yes / No)

👉 As soon as I have this information, I can do what's needed on my side to sort things out as quickly as possible.

Thanks in advance for your quick reply 🔥

See you very soon,

The Ecommerce Capital Club team`,

  'tpl-sav-relance-invoice-0-usd': `Hello 👋

Regarding your V2 access on Whop, your invitation has already been sent as a 0.00 USD invoice.

No payment is needed — you just need to accept this invitation to activate your access to the platform.

👉 Here is the invoice link:
INVOICE LINK

I also suggest checking your emails, as you should have received this same invitation directly by email.

Once the invoice is accepted, your access will be unlocked automatically and you'll be able to join the whole new ECC ecosystem.

If you can't find the email, also remember to check your spam or junk folder.

We can't wait to see you on the other side 🔥

See you very soon,

The Ecommerce Capital Club team`,

  'tpl-sav-date-prelevement': `Hello 👋

Regarding the direct debit date, the system is unfortunately fully automated, which means we can't manually change the scheduled date.

If the direct debit fails, access to the platform will be automatically suspended until the payments are settled.

As soon as the situation is back in order and the payment goes through, access is automatically reactivated.

Thank you for your understanding 🙏

See you very soon,

The Ecommerce Capital Club team`,

  'tpl-sav-niveau-advanced': `Hello 👋

To join the Advanced level, you need to post your results directly in the community's results channel to motivate the other members.

👉 An example of the expected format is already available in that channel: just follow it and publish your post using that template.

Advanced access can be unlocked from €25,000 in revenue.

Once your post is published, everything happens directly in the community: the managers check and validate the results, then grant the access.

This is the only way to unlock the Advanced level.

See you very soon 🔥

The Ecommerce Capital Club team`,

  'tpl-sav-email-present-whop': `Hello 👋

After checking on our side with the email address you gave us, I can confirm that your Whop access is active on that address.

So you already have access to the platform with this email.

Please make sure you're logged into the right Whop account, with the email address you used at sign-up, as that's usually where the problem comes from.

Also try logging out and back in, or testing from another browser/device if needed.

Since your access is active on our side, you should be able to find the course again by logging into the right account.

Let me know if the problem persists 🔥

See you very soon,

The Ecommerce Capital Club team`,

  'tpl-sav-acces-retires-defaut-paiement': `Hello 👋

Regarding your access, it has been suspended because the payment was not made within the agreed time.

Once the payment is settled and everything is back in order, we'll be able to reopen your access to the platform.

👉 So you just need to complete the payment for us to unblock the situation.

Thank you for your understanding 🙏

See you very soon,

The Ecommerce Capital Club team`,

  'tpl-sav-email-present-whop-circle': `Hello 👋

After checking on our side with the email address you gave us, I can confirm that your access to both Whop and Circle is active on that address.

So you already have access to both platforms with this email.

Please make sure you're logged into the right account, with the email address you used at sign-up, as that's usually where the problem comes from.

Also try logging out and back in, or testing from another browser/device if needed.

Since your access is active on our side, you should be able to find the course and the community again by logging into the right account.

Let me know if the problem persists 🔥

See you very soon,

The Ecommerce Capital Club team`,

  'tpl-sav-plusieurs-appareils': `Hello 👋

You can absolutely log into the course from several devices (phone, computer, tablet…), as long as the use stays personal and normal.

The idea is simple: one person = one subscription.

So you can use different devices without any problem, as long as there are no suspicious logins or account sharing.

What our systems mainly monitor are repeated simultaneous logins on several devices, or any activity that could indicate abuse.

In that kind of situation, the account may be flagged and go through a more thorough check.

As long as the use stays normal and personal, there's no problem at all 🙏

See you very soon,

The Ecommerce Capital Club team`,

  'tpl-sav-visionnage-telephone': `Hello 👋

If you do have access to the course on your computer, your access should be active on all devices, including your phone.

In that case, the problem usually comes from the login or the account used on mobile.

👉 Please check the following:

* You're logged in with the right email address
* Log out and back in on your phone
* Try another browser, or the app directly if available

In the vast majority of cases, that's enough to fix the issue.

If the problem persists after that, get back to us with more details and we'll look into it together 🔥

See you very soon,

The Ecommerce Capital Club team`,

  'tpl-sav-double-acces-associe': `Hello,

The whole Ecommerce Capital Club team would like to come back to you on an important point, and we're doing so with complete transparency.
From the start, your coaching was designed as a named, individual experience, built for one person only, to guarantee quality follow-up and a secure setting. On the former Discord community, we were flexible and tolerated some access sharing. That was a gesture on our part, never an official rule, and we understand it may have created habits.

With our move to Circle, we're taking a new step. This new platform lets us offer a more structured, more personalised environment, but it also comes with a clearer framework: one coaching programme now corresponds to one named access, linked to a single email address.

We know this change may take some getting used to, and we sincerely thank you for your understanding. Our goal remains the same: to give you the best possible coaching in the best possible conditions.

Of course, the team remains fully available to answer your questions or help you through this transition.
With our kindest regards,

The Ecommerce Capital Club team`,

  'tpl-sav-hors-sujet': `Hello 👋

Thank you for your message.

Ecommerce Capital Club support is dedicated exclusively to technical and administrative assistance related to our tools and services (platform access, payments, KYC, Circle, Whop, ECC card, technical bugs, etc.).

Your request is not a support matter. We therefore invite you to post it in the appropriate community spaces (Circle, coaching, dedicated channels, etc.), where members and coaches can give you a suitable answer.

👉 If you run into a technical or administrative problem with your account or your access, please send us the details so we can help you.

Thank you for your understanding.

The Ecommerce Capital Club team`,

  'tpl-sav-autre-bug': `Hello 👋

Thank you for your message and for reporting this problem.

We're sorry for the inconvenience and will do what's needed to identify the cause of the malfunction.

So that our tech teams can analyse the situation and find a solution quickly, could you send us the following:

* The tool or page affected by the problem.
* A short description of the malfunction, plus any error message shown.
* Ideally, a screenshot or screen recording clearly showing the problem.

We'll then be able to pass your report on to our tech teams for investigation and resolution.

Thank you for your patience and cooperation! 🙏

The Ecommerce Capital Club team`,

  'tpl-sav-reinvitation-whop': `Hello 👋

We've just sent you a 0.00 USD invoice by email to finalise your access to your Whop space.

No payment is needed — this step simply validates your onboarding and gives you your place in the new member area.

👉 Just one thing to do:
Go to your emails and accept the 0.00 USD invoice you received.

🔗 You can also accept it directly via this link:
INVOICE LINK

Once validated, your access will be activated and you'll be able to enjoy the whole ecosystem we've set up for you.

If you don't see the email right away, remember to check your spam or junk folder.

If you have any questions during the process, don't hesitate to get back to us.

We can't wait to see you on the other side 🔥

See you very soon,

The Ecommerce Capital Club team`,

  'tpl-sav-email-present-whop-guide': `Hello 👋

After checking on our side with the email address you gave us, I can confirm that your Whop access is active on that address.

So you already have access to the platform with this email.

Please make sure you're logged into the right Whop account, with the email address you used at sign-up, as that's usually where the problem comes from.

Also try logging out and back in, or testing from another browser/device if needed.

Since your access is active on our side, you should be able to find the course again by logging into the right account.

📘 You'll also find the Whop guide attached to help you find your way around the platform.

Let me know if the problem persists 🔥

See you very soon,

The Ecommerce Capital Club team`,

  'tpl-sav-remboursement': `Hello 👋

Thank you for your message.

We have received your refund request.

It has been passed on to the team concerned, who will review it carefully. We'll get back to you as soon as possible.

Thank you for your patience and understanding 🙏

See you very soon,

The Ecommerce Capital Club team`,

  'tpl-sav-virement-recu': `Hello 👋

Thank you for your message.

We can confirm that your bank transfer has been received and that everything is in order on our side.

If you have any questions, don't hesitate to get back to us.

See you very soon,

The Ecommerce Capital Club team`,

  'tpl-sav-probleme-paiement': `Hello 👋

Thank you for your message.

After checking with our team, your payment situation is not in order at the moment.

As payments are fully automated, we are unable to grant any extra time. If a payment fails, access to the platform is automatically suspended.

👉 As soon as the payment is settled, your access is automatically reactivated.

Thank you for your understanding 🙏

See you very soon,

The Ecommerce Capital Club team`,

  'tpl-sav-paiement-en-ordre': `Hello 👋

Thank you for your message.

After checking with our team, we can confirm that your payment situation is in order.

There's nothing to do on your side: your access remains active as normal.

If you have any questions, don't hesitate to get back to us.

See you very soon,

The Ecommerce Capital Club team`,

  'tpl-sav-paiement-recu-reactivation': `Hello 👋

Thank you for your message.

After checking with our team, we can confirm that your payment has been received.

Your status has been updated and your access to the platform is active again.

If you have any questions, don't hesitate to get back to us.

See you very soon,

The Ecommerce Capital Club team`,

  'tpl-sav-acces-retire-raison': `Hello 👋

Thank you for your message.

After checking with our team, your access was removed for the following reason:
REASON FOR REMOVAL

👉 As soon as the situation is settled, we'll be able to reopen your access to the platform.

If you have any questions, don't hesitate to get back to us.

Thank you for your understanding 🙏

See you very soon,

The Ecommerce Capital Club team`,

  'tpl-sav-kyc-bloque': `Hello 👋

Thank you for your message.

We've taken note of your issue with the identity verification (KYC), and it has been passed on to the team concerned for review.

👉 To help us unblock the situation faster, you can send us a screenshot of the step where you're stuck or of the error message shown.

We'll get back to you as soon as possible.

Thank you for your patience 🙏

See you very soon,

The Ecommerce Capital Club team`,

  'tpl-sav-infos-facture': `Hello 👋

Thank you for your message.

So that we can issue your invoice, please send us the following information:

- First and last name (or the company name, if the invoice must be issued in its name)
- Full address (street, postcode, city, country)
- If the invoice is in a company’s name: company number (SIRET / BCE) and VAT number

👉 As soon as we receive this information, we’ll send you your invoice.

See you very soon,

The Ecommerce Capital Club team`,

  'tpl-sav-infos-devis': `Hello 👋

Thank you for your message.

So that we can issue your quote, please send us the following information:

- First and last name
- Date of birth
- Full address (street, postcode, city, country)
- Email address
- Name and full address of the funding body

👉 As soon as we receive this information, we’ll send you your quote.

See you very soon,

The Ecommerce Capital Club team`,

  'tpl-sav-infos-attestation': `Hello 👋

Thank you for your message.

So that we can issue your training certificate, please confirm the following information:

- First and last name
- Email address used when you signed up

👉 As soon as we receive this information, we’ll send you your certificate.

See you very soon,

The Ecommerce Capital Club team`,

  'tpl-sav-prospect': `Hello 👋

Thank you for your interest in the Ecommerce Capital Club!

We'd be happy to tell you more about our course, our coaching and the various services we offer to help you grow your e-commerce business.

So we can present our offers and answer all your questions, please send us your WhatsApp number (with the country code).

👉 A member of our team will contact you directly to talk about your project, understand your needs and point you to the most suitable solution.

Thank you for your trust and see you very soon! 🙏

The Ecommerce Capital Club team`,
};
