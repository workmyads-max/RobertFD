import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Test 1: list with no sort
    const listNoSort = await base44.asServiceRole.entities.ChallengePlan.list();
    
    // Test 2: list with -created_date sort
    const listByDate = await base44.asServiceRole.entities.ChallengePlan.list('-created_date', 200);
    
    // Test 3: filter with empty object
    const filterEmpty = await base44.asServiceRole.entities.ChallengePlan.filter({});

    return Response.json({
      test1_list_no_sort: {
        count: Array.isArray(listNoSort) ? listNoSort.length : 'NOT_ARRAY',
        type: typeof listNoSort,
        raw: listNoSort,
      },
      test2_list_by_date: {
        count: Array.isArray(listByDate) ? listByDate.length : 'NOT_ARRAY',
        type: typeof listByDate,
        first_item: Array.isArray(listByDate) ? listByDate[0] : null,
      },
      test3_filter_empty: {
        count: Array.isArray(filterEmpty) ? filterEmpty.length : 'NOT_ARRAY',
        type: typeof filterEmpty,
        first_item: Array.isArray(filterEmpty) ? filterEmpty[0] : null,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});