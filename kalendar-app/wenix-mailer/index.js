import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import cron from 'node-cron';
import 'dotenv/config';

// 1. Inicializace připojení k databázi a maileru
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

console.log("Wenix Mailer spuštěn. Čekám na události...");

// 2. Nastavení plánovače (Cron). "* * * * *" znamená "Spusť se každou minutu"
cron.schedule('* * * * *', async () => {
    const now = new Date();

    // Odřízneme vteřiny a milisekundy, abychom mohli přesně porovnávat čas
    now.setSeconds(0, 0);

    // Omezíme hledání jen na události v následujících 24 hodinách, ať neprohledáváme zbytečně celou databázi
    const maxFuture = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    try {
        // 3. Vytáhneme ze Supabase všechny události - PŘIDALI JSME description a location_link
        const { data: events, error } = await supabase
            .from('events')
            .select('title, description, start_time, location_link, reminder_minutes, event_assignees(profiles(email))')
            .gt('reminder_minutes', 0)
            .gt('start_time', now.toISOString())
            .lte('start_time', maxFuture);

        if (error) {
            console.error("Chyba při čtení z databáze:", error.message);
            return;
        }

        // 4. Projdeme každou nalezenou událost
        for (const event of events) {
            const startTime = new Date(event.start_time);

            // Vypočítáme čas, kdy se má upozornění poslat
            const reminderTime = new Date(startTime.getTime() - event.reminder_minutes * 60000);
            reminderTime.setSeconds(0, 0);

            // Je PRÁVĚ TEĎ ta správná minuta pro odeslání?
            if (reminderTime.getTime() === now.getTime()) {

                // Vytáhneme čistý seznam e-mailů ze zanořené struktury databáze
                const emails = event.event_assignees
                    .map(ea => ea.profiles?.email)
                    .filter(email => email);

                if (emails.length > 0) {

                    // Příprava HTML bloků (vykreslí se, jen když v databázi reálně něco je)
                    const descriptionHtml = event.description
                        ? `<p style="margin: 0 0 16px 0; color: #52525b; font-size: 14px; line-height: 1.6;">${event.description}</p>`
                        : '';

                    const linkHtml = event.location_link
                        ? `<a href="${event.location_link}" style="display: inline-block; background-color: #0d9488; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 8px;">Připojit se ke schůzce</a>`
                        : '';

                    // 5. Odeslání e-mailu s profi designem
                    const { data, error: mailError } = await resend.emails.send({
                        from: 'Wenix Kalendář <notifikace@wenix.cz>', // Až bude doména ověřená, nech tohle
                        to: emails, // V pískovišti to dočasně nahraď svým mailem
                        subject: `⏰ Blíží se: ${event.title}`,
                        html: `
              <div style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                  
                  <div style="background-color: #131313; padding: 32px 24px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px; text-transform: uppercase;">Wenix Kalendář</h1>
                  </div>

                  <div style="padding: 40px 32px;">
                    <h2 style="margin: 0 0 16px 0; color: #18181b; font-size: 22px;">Blíží se tvá událost!</h2>
                    <p style="margin: 0 0 32px 0; color: #3f3f46; font-size: 16px; line-height: 1.5;">
                      Ahoj,<br>za malou chvíli začíná tvá naplánovaná událost. Zde máš všechny potřebné detaily po ruce:
                    </p>

                    <div style="background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 24px; border-radius: 0 12px 12px 0; margin-bottom: 32px;">
                      <h3 style="margin: 0 0 8px 0; color: #131313; font-size: 18px;">${event.title}</h3>
                      <p style="margin: 0 0 16px 0; color: #0f766e; font-weight: 600; font-size: 15px;">
                        ⏰ Dnes v ${startTime.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      ${descriptionHtml}
                      ${linkHtml}
                    </div>

                    <div style="border-top: 1px solid #e4e4e7; padding-top: 24px;">
                      <p style="margin: 0; color: #71717a; font-size: 14px; line-height: 1.5;">
                        Přejeme úspěšný den,<br><strong>Tým Wenix</strong>
                      </p>
                    </div>

                  </div>
                </div>
              </div>
            `
                    });

                    if (mailError) {
                        console.error(`Nepodařilo se odeslat mail pro ${event.title}:`, mailError);
                    } else {
                        console.log(`[${now.toLocaleTimeString('cs-CZ')}] Úspěšně odesláno upozornění na událost: ${event.title}`);
                    }
                }
            }
        }
    } catch (err) {
        console.error("Kritická chyba v hlavní smyčce:", err);
    }
});