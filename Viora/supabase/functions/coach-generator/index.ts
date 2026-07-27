import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { COACH_SYSTEM_PROMPT } from "./prompt.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FREE_LIMIT = 3;

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        );

        const {
            data: { user },
            error: authError,
        } = await supabaseClient.auth.getUser();

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Nao autorizado.' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const { data: entitlement, error: entError } = await supabaseClient
            .from('user_entitlements')
            .select('is_active, valid_until, entitlement_code')
            .eq('user_id', user.id)
            .order('valid_until', { ascending: false })
            .maybeSingle();

        if (entError) {
            console.error("Entitlement check error:", entError);
        }

        const isActive = entitlement?.is_active && (!entitlement.valid_until || new Date(entitlement.valid_until) > new Date());

        // Cliente com service role — a tabela coach_assessments só tem policy de
        // SELECT (a de INSERT insegura foi removida e nunca substituída), então
        // o client autenticado como usuário não consegue gravar aqui.
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        if (!isActive) {
            const { count, error: countError } = await supabaseAdmin
                .from('coach_assessments')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('used_free_quota', true);

            if (countError) {
                console.error("Quota check error:", countError);
                throw new Error("Falha ao checar cota de uso.");
            }

            const used = count || 0;
            const remaining = Math.max(0, FREE_LIMIT - used);

            if (remaining <= 0) {
                return new Response(
                    JSON.stringify({ error: 'Cota gratuita esgotada. Assine o plano PRO para continuar.', reason: 'quota_exceeded' }),
                    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
        }

        const { photos, goal, last_evaluation } = await req.json();

        if (!photos || (!photos.front && !photos.side && !photos.back)) {
            throw new Error("Pelo menos uma foto e necessaria.");
        }

        const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
        if (!OPENAI_API_KEY) {
            throw new Error("Servidor nao configurado (API Key ausente).");
        }

        let userPrompt = `Objetivo do Usuario: ${goal}\n`;
        if (last_evaluation) {
            userPrompt += `\nHistorico (Ultima Avaliacao do Usuario): ${last_evaluation}\nAnalise as fotos comparando o fisico atual com esse historico e explique as mudancas notadas.\n`;
        } else {
            userPrompt += `\nAnalise as fotos e gere o protocolo inicial.\n`;
        }

        const userContent: any[] = [{ type: "text", text: userPrompt }];

        for (const value of Object.values(photos)) {
            if (typeof value === 'string' && value.includes('base64,')) {
                userContent.push({
                    type: "image_url",
                    image_url: { url: value, detail: "high" }
                });
            }
        }

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-5.4-mini",
                messages: [
                    { role: "system", content: COACH_SYSTEM_PROMPT },
                    { role: "user", content: userContent }
                ],
                response_format: { type: "json_object" },
                temperature: 0.2
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("OpenAI API Error:", errorText);
            throw new Error(`Erro na IA (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        const generatedText = data.choices?.[0]?.message?.content;

        if (!generatedText) {
            console.error("OpenAI Empty Response:", JSON.stringify(data));
            throw new Error("A IA nao conseguiu analisar as imagens. Tente fotos com melhor iluminacao.");
        }

        let jsonResponse;
        try {
            jsonResponse = JSON.parse(generatedText);
        } catch (e) {
            console.error("JSON Parse Error:", generatedText);
            throw new Error("Erro ao processar a resposta da IA. Tente novamente.");
        }

        if (!jsonResponse.analysis || !jsonResponse.diet || !jsonResponse.workout) {
            throw new Error("A resposta da IA veio incompleta. Por favor, tente novamente.");
        }

        // Persiste o resultado e marca o consumo da cota grátis — sem isso o
        // contador de `used_free_quota` nunca avança e o limite de 3 nunca bate.
        const { error: insertError } = await supabaseAdmin.from('coach_assessments').insert({
            user_id: user.id,
            source: 'web',
            biotype: jsonResponse.analysis?.somatotype || null,
            estimated_body_fat: jsonResponse.analysis?.body_fat_percentage || 0,
            muscle_mass_level: jsonResponse.analysis?.muscle_mass_level || null,
            goal_suggestion: jsonResponse.workout?.focus || null,
            workout_plan: typeof jsonResponse.workout === 'string' ? jsonResponse.workout : JSON.stringify(jsonResponse.workout),
            diet_plan: typeof jsonResponse.diet === 'string' ? jsonResponse.diet : JSON.stringify(jsonResponse.diet),
            ai_raw_response: generatedText,
            ai_structured: jsonResponse,
            used_free_quota: !isActive,
        });

        if (insertError) {
            console.error("Erro ao salvar avaliação:", insertError);
        }

        return new Response(JSON.stringify(jsonResponse), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error) {
        console.error("Function Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        });
    }
});
