import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://semffcznljmbmftbaogl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_OSvxzzEtDG7zgkmaR4j5gw_2oY7otaQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function initCMS() {
    const { data, error } = await supabase.from('site_content').select('key, value, type');
    if (error || !data) return;

    data.forEach(item => {
        if (!item.value) return;

        // 1. Texty & HTML (musí být innerHTML, aby fungoval span i br)
        const textElements = document.querySelectorAll(`[data-cms="${item.key}"]`);
        textElements.forEach(el => {
            el.innerHTML = item.value;
        });

        // 2. Odkazy (href)
        const linkElements = document.querySelectorAll(`[data-cms-href="${item.key}"]`);
        linkElements.forEach(el => {
            el.href = item.value;
        });

        // 3. Obrázky
        const imgElements = document.querySelectorAll(`[data-cms-img="${item.key}"]`);
        imgElements.forEach(el => {
            if (el.tagName === 'IMG') {
                el.src = item.value;
            } else {
                el.style.backgroundImage = `url('${item.value}')`;
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', initCMS);