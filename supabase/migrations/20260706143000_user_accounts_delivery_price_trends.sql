create table if not exists user_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('product', 'offer')),
  target_id text not null,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);

create index if not exists user_favorites_user_created_at_idx
  on user_favorites(user_id, created_at desc);

alter table user_favorites enable row level security;

drop policy if exists user_favorites_select_own on user_favorites;
create policy user_favorites_select_own
  on user_favorites
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists user_favorites_insert_own on user_favorites;
create policy user_favorites_insert_own
  on user_favorites
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists user_favorites_update_own on user_favorites;
create policy user_favorites_update_own
  on user_favorites
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists user_favorites_delete_own on user_favorites;
create policy user_favorites_delete_own
  on user_favorites
  for delete
  to authenticated
  using (auth.uid() = user_id);

revoke all on table user_favorites from anon, public;
grant select, insert, update, delete on table user_favorites to authenticated;
grant select, insert, update, delete on table user_favorites to service_role;

create table if not exists user_view_history (
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('product', 'offer')),
  target_id text not null,
  snapshot jsonb not null default '{}'::jsonb,
  first_viewed_at timestamptz not null default now(),
  last_viewed_at timestamptz not null default now(),
  view_count integer not null default 1 check (view_count > 0),
  primary key (user_id, target_type, target_id)
);

create index if not exists user_view_history_user_last_viewed_at_idx
  on user_view_history(user_id, last_viewed_at desc);

alter table user_view_history enable row level security;

drop policy if exists user_view_history_select_own on user_view_history;
create policy user_view_history_select_own
  on user_view_history
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists user_view_history_insert_own on user_view_history;
create policy user_view_history_insert_own
  on user_view_history
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists user_view_history_update_own on user_view_history;
create policy user_view_history_update_own
  on user_view_history
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists user_view_history_delete_own on user_view_history;
create policy user_view_history_delete_own
  on user_view_history
  for delete
  to authenticated
  using (auth.uid() = user_id);

revoke all on table user_view_history from anon, public;
grant select, insert, update, delete on table user_view_history to authenticated;
grant select, insert, update, delete on table user_view_history to service_role;

create table if not exists product_price_daily_snapshots (
  product_id text not null references canonical_products(id) on delete cascade,
  snapshot_date date not null,
  delivery_filter text not null default 'all' check (delivery_filter in ('all', 'recharge', 'cdk', 'account', 'shared')),
  lowest_price numeric,
  currency text,
  lowest_offer_id text,
  in_stock_count integer not null default 0,
  offer_count integer not null default 0,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (product_id, snapshot_date, delivery_filter)
);

create index if not exists product_price_daily_snapshots_product_filter_date_idx
  on product_price_daily_snapshots(product_id, delivery_filter, snapshot_date desc);

alter table product_price_daily_snapshots enable row level security;
revoke all on table product_price_daily_snapshots from anon, authenticated, public;
grant select, insert, update, delete on table product_price_daily_snapshots to service_role;

create or replace function priceai_delivery_filter_tag(p_delivery text)
returns text
language sql
immutable
set search_path = public
as $$
  select case coalesce(nullif(trim(p_delivery), ''), 'all')
    when 'recharge' then 'delivery_recharge'
    when 'cdk' then 'delivery_cdk'
    when 'account' then 'delivery_account'
    when 'shared' then 'shared_access'
    else null
  end;
$$;

create or replace function priceai_public_offer_filter_tags(
  p_source_title text,
  p_tags text[] default '{}'
)
returns text[]
language plpgsql
immutable
set search_path = public
as $$
declare
  text_value text := regexp_replace(
    lower(
      regexp_replace(
        coalesce(p_source_title, '') || ' ' || array_to_string(coalesce(p_tags, array[]::text[]), ' '),
        '[[:space:]]+',
        '',
        'g'
      )
    ),
    '[【】\[\]（）()]',
    ' ',
    'g'
  );
  output text[] := '{}';
begin
  if text_value ~ '(直充|直冲|代充|代冲|人工充值|官方充值|正规充值|会员充值|订阅充值|续费|代续费|内购|代开|官方代开|卡冲|卡充|充值月卡|充值年卡)' then
    output := array_append(output, 'delivery_recharge');
  end if;

  if text_value ~ '(卡密|cdk|兑换码|激活码|礼品码|充值码|兑换链接|提链|取链|优惠链接|json格式|json文件|cpa格式|api格式|sub格式)' then
    output := array_append(output, 'delivery_cdk');
  end if;

  if text_value ~ '(成品号|成品账号|成品帐号|独享账号|独享帐号|账号密码|帐号密码|账密|白号|老号|普号|账号交付|帐号交付|邮箱交付|token|2fa|rt凭证|access_token|refresh_token)' then
    output := array_append(output, 'delivery_account');
  end if;

  if text_value !~ '(仅支持?网页|只能网页|仅网页|网页号|不支持codex|无法使用codex|不能使用codex|不能直接登录codex|无法直接登录codex|无法codex|codex不售后|不可反代|无法反代|不能反代|不支持反代)'
    and text_value ~ '(可反代|支持反代|反代\+?codex|可用codex|支持codex|直接登录codex|sub2|cpa|api格式|json格式|json文件|sub格式|cpa格式)'
  then
    output := array_append(output, 'proxy_supported');
  end if;

  if text_value !~ '(非拼车|不是拼车|不拼车|无拼车|拒绝拼车|非团购|不是团购|不团购|非共享|不是共享|不共享|无共享|非合租|不是合租|不合租|非车位|不是车位)'
    and (
      text_value ~ '(拼车|团购|拼团|车位|多人共享|多人共用|(多人|二人|两人|双人|三人|四人|五人|六人|七人|八人|九人|十人|[2-9]人|[1-9][0-9]人)体验(号|账号|帐号)|(二|两|双|三|四|五|六|七|八|九|十|[2-9]|[1-9][0-9])人(车|共享|共用|位)|多人车|车友|车队|家庭车|团号|团购车|拼车位|共享车)'
      or (text_value !~ '(独享|独立|一人一号|一人一户|专享)' and text_value ~ '(共享|共用|合租|共享号)')
    )
  then
    output := array_append(output, 'shared_access');
  end if;

  if text_value ~ '(12个月|十二个月|一年|1年|365天|三百六十五天|年卡|年度|全年)' then
    output := array_append(output, 'duration_year');
  end if;

  if text_value ~ '(6个月|六个月|180天|一百八十天|半年|半年卡)' then
    output := array_append(output, 'duration_half_year');
  end if;

  if text_value ~ '(3个月|三个月|90天|九十天|季度|季卡)' then
    output := array_append(output, 'duration_quarter');
  end if;

  if text_value ~ '(月卡|月会员|一个月|1个月|30天|三十天|一月|单月)' then
    output := array_append(output, 'duration_month');
  end if;

  if text_value ~ '((^|[^0-9])([1-9]|10)天(号|会员|体验)?|(二|两|三|四|五|六|七|八|九|十)天(号|会员|体验)?|[1-9]-10天|2到10天|2至10天|3-7天|7-10天|周会员|一周会员|体验卡|短期体验)' then
    output := array_append(output, 'duration_trial');
  end if;

  if text_value ~ '(月租|包月接码|接码包月|包月号码|长期租号|月付接码|30天接码|一个月接码|1个月接码)' then
    output := array_append(output, 'verification_monthly');
  elsif text_value ~ '(长效接码|长期接码|长效手机号|长期手机号|原始接码链接|电话接码链接|带电话接码链接|接码链接|取码url|取码链接|可续接|续接)' then
    output := array_append(output, 'verification_long');
  elsif text_value ~ '(短效接码|短效手机号|短期接码|短时接码|临时号码|短效号码|实卡接码|实体卡接码)' then
    output := array_append(output, 'verification_short');
  elsif text_value ~ '(单次接码|一次性接码|一次性验证|1次接码|1次验证|一次码|单号接码|接一次|质保1次成功接码|质保一次成功接码)' then
    output := array_append(output, 'verification_single');
  end if;

  if text_value ~ '((^|[^0-9])(\+|➕)1([^0-9]|$)|美区|美国|🇺🇸)' then
    output := array_append(output, 'telegram_region_us');
  elsif text_value ~ '((\+|➕)91|区号91|印度)' then
    output := array_append(output, 'telegram_region_india');
  end if;

  if text_value ~ '(telegram.{0,12}(星星|star|stars)|(星星|star|stars).{0,12}telegram|星星兑换码|星星代充)' then
    output := array_append(output, 'telegram_stars');
  elsif text_value ~ '(telegram.{0,16}(premium|会员|pro)|tg.{0,16}(premium|会员|pro)|电报.{0,16}(premium|会员|pro)|飞机.{0,16}(premium|会员|pro)|premium.{0,16}(telegram|tg)|会员.{0,16}(telegram|tg|电报)'
    and text_value ~ '(12个月|十二个月|一年|1年|年费|一年会员|12month|12months)'
  then
    output := array_append(output, 'telegram_premium_year');
  elsif text_value ~ '(telegram.{0,16}(premium|会员|pro)|tg.{0,16}(premium|会员|pro)|电报.{0,16}(premium|会员|pro)|飞机.{0,16}(premium|会员|pro)|premium.{0,16}(telegram|tg)|会员.{0,16}(telegram|tg|电报)'
    and text_value ~ '(6个月|六个月|六月|6月|半年|6month|6months)'
  then
    output := array_append(output, 'telegram_premium_half_year');
  elsif text_value ~ '(telegram.{0,16}(premium|会员|pro)|tg.{0,16}(premium|会员|pro)|电报.{0,16}(premium|会员|pro)|飞机.{0,16}(premium|会员|pro)|premium.{0,16}(telegram|tg)|会员.{0,16}(telegram|tg|电报)'
    and text_value ~ '(3个月|三个月|三月|3月|3month|3months)'
  then
    output := array_append(output, 'telegram_premium_quarter');
  end if;

  if (
      (
        text_value ~ '(包gcp|支持gcp|gcp可用|gcp已开|gcp正常|googlecloud|谷歌云)'
        and text_value !~ '(不包gcp|无gcp|gcp已禁用|gcp禁用|不支持gcp|gcp不可用|不带gcp|不含gcp|不送gcp)'
      )
      or (
        text_value ~ '(包反重力|支持反重力|反重力直接用|反重力可用|可用反重力|antigravity)'
        and text_value !~ '(不包反重力|不支持反重力|反重力不可用|无法反重力|不能反重力|不等于反重力)'
      )
      or (
        text_value ~ '((gemini|googleai|googleaipro|gcp|反重力|antigravity).{0,16}cli|cli.{0,16}(gemini|googleai|googleaipro|gcp|反重力|antigravity)|codeassist)'
        and text_value !~ '(不支持cli|cli不可用|无法cli|不能cli)'
      )
    )
  then
    output := array_append(output, 'gemini_antigravity_gcp');
  end if;

  if text_value !~ '(无需绑定手机|无需绑手机|无须绑定手机|无须绑手机|免绑手机|不用绑手机|不需要绑定手机|不需要绑手机)'
    and text_value ~ '(需要绑定手机|需绑定手机|需要绑手机|需绑手机|绑定手机号|绑定手机|手机号接码|手机接码|长效接码|接码|人机号|人机账号|人机帐号)'
  then
    output := array_append(output, 'gemini_phone_required');
  end if;

  if text_value !~ '(无需申诉|无须申诉|免申诉|不用申诉|不需要申诉|无需注册|无须注册|免注册|不用注册|不需要注册)'
    and text_value ~ '(首登需要申诉|需要申诉|需申诉|申诉|需注册|需要注册|没注册过谷歌|未注册过谷歌|没注册过google|未注册过google)'
  then
    output := array_append(output, 'gemini_appeal_required');
  end if;

  if text_value !~ '(无.{0,4}质保|没.{0,4}质保|不质保|不保|不售后|售后不管|一律不售后|无售后|不作售后条件|不做售后|不管售后)'
    and text_value !~ '(质保首登|保首登|包首登|首登质保|首次登录|首次登陆|质保首次|质保购买一小时内首登|质保[0-9]+h?内首登|质保上车|只质保上车|仅质保上车|包上车|保上车|上车质保|质保登上|质保登录|质保登陆|质保直登|质保首登成功)'
    and text_value !~ '(质保([1-9]|1[0-4]|一|二|三|四|五|六|七|八|九|十|十一|十二|十三|十四)天|([1-9]|1[0-4])天质保|7天售后|七天售后|质保[0-9]{1,2}h|质保(24|48|72)小时|[0-9]+h质保|[0-9]+小时质保|质保(1|2|3|4|5|6|7|8|9|一|二|三|四|五|六|七|八|九)次)'
    and text_value ~ '(质保(1[5-9]|[2-9][0-9]|[1-9][0-9]{2,})天|(1[5-9]|[2-9][0-9]|[1-9][0-9]{2,})天质保|质保(十五|二十|二十五|二十八|三十|一百八十)天|(十五|二十|二十五|二十八|三十|一百八十)天质保|质保(半个月|一个月|1个月|一月|整月|两个月|2个月|二个月|三个月|3个月|一年|1年|12个月|180天)|(半个月|一个月|1个月|一月|整月|两个月|2个月|二个月|三个月|3个月|一年|1年|12个月|180天)质保|全程质保|全程保|包月售后|包月质保|质保包月)'
  then
    output := array_append(output, 'warranty_long');
  end if;

  return output;
end;
$$;

drop function if exists list_public_product_summaries();
drop function if exists list_public_product_summaries(text);

create or replace function list_public_product_summaries(p_delivery text default 'all')
returns table (
  id text,
  slug text,
  display_name text,
  platform text,
  product_type text,
  spec text,
  summary text,
  aliases text[],
  updated_at timestamptz,
  offer_count bigint,
  in_stock_count bigint,
  out_of_stock_count bigint,
  lowest_price numeric,
  warranty_lowest_price numeric,
  warranty_offer_count bigint,
  latest_seen_at timestamptz,
  lowest_offer jsonb,
  warranty_lowest_offer jsonb,
  has_out_of_stock boolean,
  offer_search_text text,
  price_trend jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  with params as (
    select
      coalesce(nullif(trim(p_delivery), ''), 'all') as delivery_filter,
      priceai_delivery_filter_tag(p_delivery) as delivery_tag,
      ((now() at time zone 'Asia/Shanghai')::date) as today
  ),
  products as (
    select *
    from canonical_products
    where is_active = true
  ),
  offer_base as (
    select
      raw_offers.*,
      priceai_public_offer_filter_tags(raw_offers.source_title, raw_offers.tags) as public_offer_filter_tags,
      case
        when raw_offers.status <> 'out_of_stock'
          and raw_offers.price is not null
          and raw_offers.url <> ''
          and coalesce(raw_offers.effective_status, '') not in ('unavailable', 'stale', 'failed')
          and coalesce(raw_offers.freshness_status, '') not in ('expired', 'failed')
          and (raw_offers.expires_at is null or raw_offers.expires_at > now())
        then true
        else false
      end as is_public_available,
      coalesce(raw_offers.verified_at, raw_offers.last_seen_at, raw_offers.captured_at, raw_offers.source_updated_at) as public_updated_at,
      coalesce(raw_offers.source_store_name, raw_offers.source_name, '') as public_source_label,
      priceai_public_offer_dedupe_key(
        raw_offers.canonical_product_id,
        raw_offers.url,
        raw_offers.source_title,
        raw_offers.price
      ) as public_dedupe_key
    from raw_offer_public_state raw_offers
    join products on products.id = raw_offers.canonical_product_id
    cross join params
    where raw_offers.hidden = false
      and (params.delivery_tag is null or priceai_public_offer_filter_tags(raw_offers.source_title, raw_offers.tags) @> array[params.delivery_tag]::text[])
  ),
  offers as (
    select *
    from (
      select
        offer_base.*,
        row_number() over (
          partition by offer_base.public_dedupe_key
          order by
            case when offer_base.is_public_available then 0 else 1 end asc,
            case when offer_base.public_offer_filter_tags @> array['shared_access']::text[] then 1 else 0 end asc,
            offer_base.source_priority desc nulls last,
            offer_base.confidence desc nulls last,
            offer_base.public_updated_at desc nulls last,
            offer_base.public_source_label asc,
            offer_base.source_title asc,
            offer_base.url asc,
            offer_base.id asc
        ) as dedupe_rank
      from offer_base
    ) ranked_dedupe
    where ranked_dedupe.dedupe_rank = 1
  ),
  lowest_ranked as (
    select
      offers.*,
      row_number() over (
        partition by offers.canonical_product_id
        order by
          offers.price asc nulls last,
          offers.public_updated_at desc nulls last,
          offers.public_source_label asc,
          offers.source_title asc,
          offers.url asc,
          offers.id asc
      ) as lowest_rank
    from offers
    cross join params
    where offers.is_public_available = true
      and (
        params.delivery_filter <> 'all'
        or not (offers.public_offer_filter_tags @> array['shared_access']::text[])
      )
  ),
  warranty_lowest_ranked as (
    select
      offers.*,
      row_number() over (
        partition by offers.canonical_product_id
        order by
          offers.price asc nulls last,
          offers.public_updated_at desc nulls last,
          offers.public_source_label asc,
          offers.source_title asc,
          offers.url asc,
          offers.id asc
      ) as warranty_lowest_rank
    from offers
    cross join params
    where offers.is_public_available = true
      and offers.public_offer_filter_tags @> array['warranty_long']::text[]
      and (
        params.delivery_filter <> 'all'
        or not (offers.public_offer_filter_tags @> array['shared_access']::text[])
      )
  ),
  stats as (
    select
      offers.canonical_product_id,
      count(*) as offer_count,
      count(*) filter (where offers.is_public_available = true) as in_stock_count,
      count(*) filter (
        where offers.is_public_available = true
          and offers.public_offer_filter_tags @> array['warranty_long']::text[]
      ) as warranty_offer_count,
      count(*) filter (where offers.is_public_available = false) as out_of_stock_count,
      max(offers.public_updated_at) as latest_seen_at,
      bool_or(offers.is_public_available = false) as has_out_of_stock,
      left(
        string_agg(
          distinct concat_ws(' ', offers.source_title, offers.source_name, offers.source_store_name),
          ' '
        ),
        480
      ) as offer_search_text
    from offers
    group by offers.canonical_product_id
  ),
  trend_rows as (
    select
      products.id as product_id,
      latest.lowest_price as latest_price,
      previous_day.lowest_price as previous_day_price,
      previous_7d.lowest_price as previous_7d_price,
      prior_7d.min_price as prior_7d_min_price,
      latest.snapshot_date as latest_snapshot_date,
      previous_day.snapshot_date as previous_day_snapshot_date,
      previous_7d.snapshot_date as previous_7d_snapshot_date
    from products
    cross join params
    left join lateral (
      select *
      from product_price_daily_snapshots
      where product_price_daily_snapshots.product_id = products.id
        and product_price_daily_snapshots.delivery_filter = params.delivery_filter
        and product_price_daily_snapshots.snapshot_date <= params.today
      order by product_price_daily_snapshots.snapshot_date desc
      limit 1
    ) latest on true
    left join lateral (
      select *
      from product_price_daily_snapshots
      where product_price_daily_snapshots.product_id = products.id
        and product_price_daily_snapshots.delivery_filter = params.delivery_filter
        and product_price_daily_snapshots.snapshot_date < params.today
      order by product_price_daily_snapshots.snapshot_date desc
      limit 1
    ) previous_day on true
    left join lateral (
      select *
      from product_price_daily_snapshots
      where product_price_daily_snapshots.product_id = products.id
        and product_price_daily_snapshots.delivery_filter = params.delivery_filter
        and product_price_daily_snapshots.snapshot_date <= params.today - 7
      order by product_price_daily_snapshots.snapshot_date desc
      limit 1
    ) previous_7d on true
    left join lateral (
      select min(lowest_price) as min_price
      from product_price_daily_snapshots
      where product_price_daily_snapshots.product_id = products.id
        and product_price_daily_snapshots.delivery_filter = params.delivery_filter
        and product_price_daily_snapshots.snapshot_date < params.today
        and product_price_daily_snapshots.snapshot_date >= params.today - 7
        and product_price_daily_snapshots.lowest_price is not null
    ) prior_7d on true
  )
  select
    products.id,
    products.slug,
    products.display_name,
    products.platform,
    products.product_type,
    products.spec,
    products.summary,
    products.aliases,
    products.updated_at,
    coalesce(stats.offer_count, 0) as offer_count,
    coalesce(stats.in_stock_count, 0) as in_stock_count,
    coalesce(stats.out_of_stock_count, 0) as out_of_stock_count,
    lowest.price as lowest_price,
    warranty_lowest.price as warranty_lowest_price,
    coalesce(stats.warranty_offer_count, 0) as warranty_offer_count,
    stats.latest_seen_at,
    case
      when lowest.id is null then null
      else jsonb_build_object(
        'id', lowest.id,
        'source_id', lowest.source_id,
        'source_name', lowest.source_name,
        'source_store_name', lowest.source_store_name,
        'source_title', lowest.source_title,
        'price', lowest.price,
        'currency', lowest.currency,
        'status', lowest.status,
        'url', lowest.url
      )
    end as lowest_offer,
    case
      when warranty_lowest.id is null then null
      else jsonb_build_object(
        'id', warranty_lowest.id,
        'source_id', warranty_lowest.source_id,
        'source_name', warranty_lowest.source_name,
        'source_store_name', warranty_lowest.source_store_name,
        'source_title', warranty_lowest.source_title,
        'price', warranty_lowest.price,
        'currency', warranty_lowest.currency,
        'status', warranty_lowest.status,
        'url', warranty_lowest.url
      )
    end as warranty_lowest_offer,
    coalesce(stats.has_out_of_stock, false) as has_out_of_stock,
    coalesce(stats.offer_search_text, '') as offer_search_text,
    case
      when lowest.price is null or (trend_rows.previous_day_price is null and trend_rows.previous_7d_price is null and trend_rows.latest_price is null) then null
      else jsonb_build_object(
        'currentPrice', lowest.price,
        'previousDayPrice', trend_rows.previous_day_price,
        'previous7dPrice', trend_rows.previous_7d_price,
        'deltaDay', case when trend_rows.previous_day_price is null then null else lowest.price - trend_rows.previous_day_price end,
        'delta7d', case when trend_rows.previous_7d_price is null then null else lowest.price - trend_rows.previous_7d_price end,
        'isNewLow7d', trend_rows.prior_7d_min_price is not null and lowest.price < trend_rows.prior_7d_min_price,
        'isNewListing', trend_rows.previous_day_price is null and trend_rows.latest_snapshot_date is not null,
        'latestSnapshotDate', trend_rows.latest_snapshot_date,
        'previousDayDate', trend_rows.previous_day_snapshot_date,
        'previous7dDate', trend_rows.previous_7d_snapshot_date
      )
    end as price_trend
  from products
  left join stats on stats.canonical_product_id = products.id
  left join lowest_ranked lowest
    on lowest.canonical_product_id = products.id
    and lowest.lowest_rank = 1
  left join warranty_lowest_ranked warranty_lowest
    on warranty_lowest.canonical_product_id = products.id
    and warranty_lowest.warranty_lowest_rank = 1
  left join trend_rows on trend_rows.product_id = products.id
  order by products.platform, products.display_name, products.id;
$$;

drop function if exists get_public_product_summary(text);
drop function if exists get_public_product_summary(text, text);

create or replace function get_public_product_summary(
  p_product_key text,
  p_delivery text default 'all'
)
returns table (
  id text,
  slug text,
  display_name text,
  platform text,
  product_type text,
  spec text,
  summary text,
  aliases text[],
  updated_at timestamptz,
  offer_count bigint,
  in_stock_count bigint,
  out_of_stock_count bigint,
  lowest_price numeric,
  warranty_lowest_price numeric,
  warranty_offer_count bigint,
  latest_seen_at timestamptz,
  lowest_offer jsonb,
  warranty_lowest_offer jsonb,
  has_out_of_stock boolean,
  offer_search_text text,
  price_trend jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select *
  from list_public_product_summaries(p_delivery)
  where list_public_product_summaries.id = p_product_key
    or list_public_product_summaries.slug = p_product_key
  limit 1;
$$;

drop function if exists list_public_offers_page(text, text, text, text, text, numeric, numeric, integer, integer);
drop function if exists list_public_offers_page(text, text, text, text, text, numeric, numeric, text, integer, integer);

create or replace function list_public_offers_page(
  p_query text default null,
  p_platform text default null,
  p_product_type text default null,
  p_stock text default null,
  p_sort text default null,
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_delivery text default 'all',
  p_limit integer default 80,
  p_offset integer default 0
)
returns table (
  id text,
  source_id text,
  source_name text,
  source_store_name text,
  source_title text,
  price numeric,
  currency text,
  status text,
  url text,
  tags text[],
  filter_tags text[],
  stock_count integer,
  hidden boolean,
  canonical_product_id text,
  category_slug text,
  captured_at timestamptz,
  source_updated_at timestamptz,
  last_seen_at timestamptz,
  verified_at timestamptz,
  expires_at timestamptz,
  source_priority integer,
  confidence numeric,
  effective_status text,
  freshness_status text,
  last_failed_at timestamptz,
  failure_reason text,
  product_id text,
  product_slug text,
  product_display_name text,
  product_platform text,
  product_type text,
  product_spec text,
  product_summary text,
  product_updated_at timestamptz,
  total_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with params as (
    select priceai_delivery_filter_tag(p_delivery) as delivery_tag
  ),
  filtered as (
    select
      raw_offers.*,
      priceai_public_offer_filter_tags(raw_offers.source_title, raw_offers.tags) as public_filter_tags_live,
      canonical_products.id as product_id,
      canonical_products.slug as product_slug,
      canonical_products.display_name as product_display_name,
      canonical_products.platform as product_platform,
      canonical_products.product_type,
      canonical_products.spec as product_spec,
      canonical_products.summary as product_summary,
      canonical_products.updated_at as product_updated_at,
      case
        when raw_offers.status <> 'out_of_stock'
          and raw_offers.price is not null
          and raw_offers.url <> ''
          and coalesce(raw_offers.effective_status, '') not in ('unavailable', 'stale', 'failed')
          and coalesce(raw_offers.freshness_status, '') not in ('expired', 'failed')
          and (raw_offers.expires_at is null or raw_offers.expires_at > now())
        then true
        else false
      end as is_public_available,
      case
        when priceai_public_offer_filter_tags(raw_offers.source_title, raw_offers.tags) @> array['shared_access']::text[]
        then 1
        else 0
      end as shared_access_rank,
      coalesce(raw_offers.verified_at, raw_offers.last_seen_at, raw_offers.captured_at, raw_offers.source_updated_at) as public_updated_at,
      coalesce(raw_offers.source_store_name, raw_offers.source_name, '') as public_source_label,
      priceai_public_offer_dedupe_key(
        raw_offers.canonical_product_id,
        raw_offers.url,
        raw_offers.source_title,
        raw_offers.price
      ) as public_dedupe_key,
      concat_ws(
        ' ',
        raw_offers.source_title,
        raw_offers.source_name,
        raw_offers.source_store_name,
        canonical_products.display_name,
        canonical_products.platform,
        canonical_products.product_type,
        canonical_products.spec
      ) as public_haystack
    from raw_offer_public_state raw_offers
    join canonical_products on canonical_products.id = raw_offers.canonical_product_id
    cross join params
    where raw_offers.hidden = false
      and canonical_products.is_active = true
      and (params.delivery_tag is null or priceai_public_offer_filter_tags(raw_offers.source_title, raw_offers.tags) @> array[params.delivery_tag]::text[])
      and (p_platform is null or p_platform = '' or p_platform = '全部' or canonical_products.platform = p_platform)
      and (p_product_type is null or p_product_type = '' or p_product_type = '全部' or canonical_products.product_type = p_product_type)
      and (p_min_price is null or raw_offers.price >= p_min_price)
      and (p_max_price is null or raw_offers.price <= p_max_price)
  ),
  matched_filter as (
    select *
    from filtered
    where (p_query is null or trim(p_query) = '' or filtered.public_haystack ilike ('%' || trim(p_query) || '%'))
      and (p_stock is null or p_stock = '' or p_stock = 'all'
        or (p_stock = 'available' and filtered.is_public_available = true)
        or (p_stock = 'out_of_stock' and filtered.is_public_available = false))
  ),
  deduped as (
    select *
    from (
      select
        matched_filter.*,
        row_number() over (
          partition by matched_filter.public_dedupe_key
          order by
            case when matched_filter.is_public_available then 0 else 1 end asc,
            matched_filter.shared_access_rank asc,
            matched_filter.source_priority desc nulls last,
            matched_filter.confidence desc nulls last,
            matched_filter.public_updated_at desc nulls last,
            matched_filter.public_source_label asc,
            matched_filter.source_title asc,
            matched_filter.url asc,
            matched_filter.id asc
        ) as dedupe_rank
      from matched_filter
    ) ranked_dedupe
    where ranked_dedupe.dedupe_rank = 1
  ),
  matched as (
    select
      deduped.*,
      count(*) over() as total_count
    from deduped
  )
  select
    matched.id,
    matched.source_id,
    matched.source_name,
    matched.source_store_name,
    matched.source_title,
    matched.price,
    matched.currency,
    matched.status,
    matched.url,
    matched.tags,
    matched.public_filter_tags_live as filter_tags,
    matched.stock_count,
    matched.hidden,
    matched.canonical_product_id,
    matched.category_slug,
    matched.captured_at,
    matched.source_updated_at,
    matched.last_seen_at,
    matched.verified_at,
    matched.expires_at,
    matched.source_priority,
    matched.confidence,
    matched.effective_status,
    matched.freshness_status,
    matched.last_failed_at,
    matched.failure_reason,
    matched.product_id,
    matched.product_slug,
    matched.product_display_name,
    matched.product_platform,
    matched.product_type,
    matched.product_spec,
    matched.product_summary,
    matched.product_updated_at,
    matched.total_count
  from matched
  order by
    case matched.product_platform
      when 'ChatGPT' then 1
      when 'Claude' then 2
      when 'Gemini' then 3
      when 'Grok' then 4
      when 'Google' then 5
      when 'API/CDK' then 6
      when '邮箱' then 7
      when '接码' then 8
      when '其他' then 99
      else 50
    end asc,
    case when p_sort = 'updated' then null else case when matched.is_public_available then 0 else 1 end end asc nulls last,
    case when p_sort = 'updated' then matched.public_updated_at end desc nulls last,
    case when p_sort = 'channels' then matched.public_source_label end asc nulls last,
    case when p_sort = 'updated' or p_sort = 'channels' then null else case when matched.is_public_available then matched.shared_access_rank else 0 end end asc nulls last,
    case when p_sort = 'price' or p_sort is null or p_sort = '' or p_sort = 'available_price' then matched.price end asc nulls last,
    matched.public_updated_at desc nulls last,
    matched.public_source_label asc,
    matched.source_title asc,
    matched.url asc,
    matched.id asc
  limit greatest(least(coalesce(p_limit, 80), 1200), 1)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

create or replace function refresh_product_price_daily_snapshots()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer := 0;
begin
  with delivery_filters(delivery_filter, delivery_tag) as (
    values
      ('all'::text, null::text),
      ('recharge', 'delivery_recharge'),
      ('cdk', 'delivery_cdk'),
      ('account', 'delivery_account'),
      ('shared', 'shared_access')
  ),
  products as (
    select id
    from canonical_products
    where is_active = true
  ),
  offer_base as (
    select
      delivery_filters.delivery_filter,
      raw_offers.*,
      priceai_public_offer_filter_tags(raw_offers.source_title, raw_offers.tags) as public_offer_filter_tags,
      coalesce(raw_offers.verified_at, raw_offers.last_seen_at, raw_offers.captured_at, raw_offers.source_updated_at) as public_updated_at,
      coalesce(raw_offers.source_store_name, raw_offers.source_name, '') as public_source_label,
      case
        when raw_offers.status <> 'out_of_stock'
          and raw_offers.price is not null
          and raw_offers.url <> ''
          and coalesce(raw_offers.effective_status, '') not in ('unavailable', 'stale', 'failed')
          and coalesce(raw_offers.freshness_status, '') not in ('expired', 'failed')
          and (raw_offers.expires_at is null or raw_offers.expires_at > now())
        then true
        else false
      end as is_public_available
    from raw_offer_public_state raw_offers
    join products on products.id = raw_offers.canonical_product_id
    cross join delivery_filters
    where raw_offers.hidden = false
      and (delivery_filters.delivery_tag is null or priceai_public_offer_filter_tags(raw_offers.source_title, raw_offers.tags) @> array[delivery_filters.delivery_tag]::text[])
  ),
  ranked_lowest as (
    select
      offer_base.*,
      row_number() over (
        partition by offer_base.canonical_product_id, offer_base.delivery_filter
        order by
          offer_base.price asc nulls last,
          offer_base.public_updated_at desc nulls last,
          offer_base.public_source_label asc,
          offer_base.source_title asc,
          offer_base.url asc,
          offer_base.id asc
      ) as lowest_rank
    from offer_base
    where offer_base.is_public_available = true
      and (
        offer_base.delivery_filter <> 'all'
        or not (offer_base.public_offer_filter_tags @> array['shared_access']::text[])
      )
  ),
  stats as (
    select
      offer_base.canonical_product_id,
      offer_base.delivery_filter,
      count(*) as offer_count,
      count(*) filter (where offer_base.is_public_available = true) as in_stock_count
    from offer_base
    group by offer_base.canonical_product_id, offer_base.delivery_filter
  )
  insert into product_price_daily_snapshots (
    product_id,
    snapshot_date,
    delivery_filter,
    lowest_price,
    currency,
    lowest_offer_id,
    in_stock_count,
    offer_count,
    generated_at
  )
  select
    stats.canonical_product_id,
    (now() at time zone 'Asia/Shanghai')::date,
    stats.delivery_filter,
    ranked_lowest.price,
    ranked_lowest.currency,
    ranked_lowest.id,
    stats.in_stock_count::integer,
    stats.offer_count::integer,
    now()
  from stats
  left join ranked_lowest
    on ranked_lowest.canonical_product_id = stats.canonical_product_id
    and ranked_lowest.delivery_filter = stats.delivery_filter
    and ranked_lowest.lowest_rank = 1
  on conflict (product_id, snapshot_date, delivery_filter) do update set
    lowest_price = excluded.lowest_price,
    currency = excluded.currency,
    lowest_offer_id = excluded.lowest_offer_id,
    in_stock_count = excluded.in_stock_count,
    offer_count = excluded.offer_count,
    generated_at = excluded.generated_at;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

revoke execute on function priceai_delivery_filter_tag(text) from anon, authenticated, public;
revoke execute on function priceai_public_offer_filter_tags(text, text[]) from anon, authenticated, public;
revoke execute on function list_public_product_summaries(text) from anon, authenticated, public;
revoke execute on function get_public_product_summary(text, text) from anon, authenticated, public;
revoke execute on function list_public_offers_page(text, text, text, text, text, numeric, numeric, text, integer, integer) from anon, authenticated, public;
revoke execute on function refresh_product_price_daily_snapshots() from anon, authenticated, public;

grant execute on function priceai_delivery_filter_tag(text) to service_role;
grant execute on function priceai_public_offer_filter_tags(text, text[]) to service_role;
grant execute on function list_public_product_summaries(text) to service_role;
grant execute on function get_public_product_summary(text, text) to service_role;
grant execute on function list_public_offers_page(text, text, text, text, text, numeric, numeric, text, integer, integer) to service_role;
grant execute on function refresh_product_price_daily_snapshots() to service_role;

delete from public_api_snapshots
where kind in ('explorer', 'offers', 'product_offers');

insert into public_api_snapshots (
  kind,
  cache_key,
  schema_version,
  payload,
  generated_at,
  updated_at
)
values (
  'refresh_state',
  'public-prices',
  1,
  jsonb_build_object(
    'dirty', true,
    'dirtyAt', now(),
    'reason', 'migration add account data, delivery filters and product price trends',
    'refreshIntervalSeconds', 60,
    'globalDirty', true,
    'fullRefreshRequired', true,
    'affectedProductIds', jsonb_build_array(),
    'affectedOfferIds', jsonb_build_array(),
    'affectedSourceIds', jsonb_build_array()
  ),
  now(),
  now()
)
on conflict (kind, cache_key) do update set
  schema_version = excluded.schema_version,
  payload = public_api_snapshots.payload || excluded.payload,
  generated_at = excluded.generated_at,
  updated_at = excluded.updated_at;
