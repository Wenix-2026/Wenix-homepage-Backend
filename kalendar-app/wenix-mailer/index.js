import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import cron from 'node-cron';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

console.log("Wenix Mailer spuštěn. Čekám na události...");

cron.schedule('* * * * *', async () => {
    const now = new Date();
    now.setSeconds(0, 0);

    const maxFuture = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    try {
        const { data: events, error } = await supabase
            .from('events')
            .select('title, description, start_time, location_link, reminder_minutes, tags, event_assignees(profiles(email))')
            .gt('reminder_minutes', 0)
            .gt('start_time', now.toISOString())
            .lte('start_time', maxFuture);

        if (error) {
            console.error("Chyba při čtení z databáze:", error.message);
            return;
        }

        for (const event of events) {
            const startTime = new Date(event.start_time);
            const reminderTime = new Date(startTime.getTime() - event.reminder_minutes * 60000);
            reminderTime.setSeconds(0, 0);

            if (reminderTime.getTime() === now.getTime()) {
                const emails = event.event_assignees
                    .map(ea => ea.profiles?.email)
                    .filter(email => email);

                if (emails.length > 0) {

                    const descriptionHtml = event.description
                        ? `<p style="margin: 0 0 20px 0; color: #a1a1aa; font-size: 14px; line-height: 1.6; font-weight: 400;">${event.description}</p>`
                        : '';

                    let tagsHtml = '';
                    if (event.tags && Array.isArray(event.tags) && event.tags.length > 0) {
                        const tagsList = event.tags
                            .map(tag => `<span style="display: inline-block; background-color: #27272a; color: #e4e4e7; border: 1px solid #3f3f46; font-size: 11px; padding: 4px 8px; border-radius: 6px; margin-right: 6px; margin-bottom: 6px; font-weight: 500;">#${tag}</span>`)
                            .join('');
                        tagsHtml = `<div style="margin-top: 16px; margin-bottom: 8px;">${tagsList}</div>`;
                    }

                    let actionButtonsHtml = '';
                    if (event.location_link && event.location_link.trim() !== '') {
                        actionButtonsHtml += `
                            <a href="${event.location_link}" style="display: inline-block; background-color: #0d9488; color: #ffffff; text-decoration: none; padding: 11px 20px; border-radius: 10px; font-weight: 600; font-size: 13px; margin-right: 12px; margin-bottom: 10px; letter-spacing: 0.5px; border: 1px solid #14b8a6;">
                                Připojit se k hovoru
                            </a>
                        `;
                    }
                    actionButtonsHtml += `
                        <a href="https://kalendar.wenix.cz" style="display: inline-block; background-color: #1c1c1f; color: #e4e4e7; text-decoration: none; padding: 11px 20px; border-radius: 10px; font-weight: 600; font-size: 13px; margin-bottom: 10px; border: 1px solid #2d2d30; letter-spacing: 0.5px;">
                            Otevřít kalendář
                        </a>
                    `;

                    // OPRAVA ČASU: Natvrdo vynutíme české časové pásmo, i když kontejner běží v UTC
                    const formattedTime = startTime.toLocaleTimeString('cs-CZ', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Europe/Prague'
                    });
                    const formattedDate = startTime.toLocaleDateString('cs-CZ', {
                        day: 'numeric',
                        month: 'short',
                        timeZone: 'Europe/Prague'
                    });

                    const result = await resend.emails.send({
                        from: 'Wenix Kalendář <notifikace@wenix.cz>',
                        to: emails,
                        subject: `⚡ Wenix: ${event.title} (${formattedTime})`,
                        html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; padding: 50px 20px; color: #f4f4f5;">
                <div style="max-width: 540px; margin: 0 auto; background-color: #121214; border-radius: 16px; overflow: hidden; border: 1px solid #202023; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
                  
                  <div style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #1c1c1f;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td>
                          <span style="font-size: 11px; font-weight: 700; color: #0d9488; text-transform: uppercase; letter-spacing: 2.5px; display: block; margin-bottom: 4px;">Nadcházející agenda</span>
                          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">${event.title}</h1>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <div style="padding: 32px;">
                    
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <span style="font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 2px;">Čas startu</span>
                          <span style="font-size: 18px; font-weight: 700; color: #ffffff; display: block;">
                            <span style="color: #0d9488;">●</span> ${formattedTime} <span style="font-size: 14px; color: #a1a1aa; font-weight: 400; margin-left: 6px;">(${formattedDate})</span>
                          </span>
                        </td>
                      </tr>
                    </table>

                    ${descriptionHtml}
                    ${tagsHtml}
                    
                    <div style="margin-top: 28px; padding-top: 12px;">
                      ${actionButtonsHtml}
                    </div>

                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #1c1c1f;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td>
                            <p style="margin: 0; color: #52525b; font-size: 12px; line-height: 1.5; font-weight: 500;">
                              Tuto notifikaci odeslal systém Wenix na základě nastavení připomínačů.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </div>

                  </div>
                </div>
              </div>
            `
                    });

                    if (result.error) {
                        console.error(`Nepodařilo se odeslat mail pro ${event.title}:`, result.error);
                    } else {
                        console.log(`[${now.toLocaleTimeString('cs-CZ')}] Úspěšně odesláno nové upozornění na událost: ${event.title}`);
                    }
                }
            }
        }
    } catch (err) {
        console.error("Kritická chyba v hlavní smyčce:", err);
    }
});