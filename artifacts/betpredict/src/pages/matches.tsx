import { useState } from "react";
import { useListMatches, useListLeagues, useListCountries, getListMatchesQueryKey } from "@workspace/api-client-react";
import { Search, Filter, LayoutGrid, List, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchCard } from "@/components/match-card";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/use-debounce";

export default function MatchesPage() {
  const [search, setSearch] = useState("");
  const [leagueId, setLeagueId] = useState<string>("all");
  const [country, setCountry] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [groupBy, setGroupBy] = useState<"none" | "league" | "country">("none");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const debouncedSearch = useDebounce(search, 300);

  const params = {
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(leagueId && leagueId !== "all" ? { leagueId } : {}),
    ...(country && country !== "all" ? { country } : {}),
    ...(status && status !== "all" ? { status } : {}),
    page,
    limit: 12,
  };

  const { data: matchData, isLoading } = useListMatches(params, {
    query: { queryKey: getListMatchesQueryKey(params) },
  });
  const { data: leagues } = useListLeagues();
  const { data: countries } = useListCountries();

  const matches = matchData?.matches ?? [];

  const grouped = groupBy !== "none" ? groupMatches(matches, groupBy) : null;

  function resetFilters() {
    setSearch("");
    setLeagueId("all");
    setCountry("all");
    setStatus("all");
    setPage(1);
  }

  const hasFilters = debouncedSearch || (leagueId && leagueId !== "all") || (country && country !== "all") || (status && status !== "all");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-white tracking-tight">Match Explorer</h1>
        <p className="text-muted-foreground text-sm">Search, filter and analyse matches worldwide.</p>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-testid="input-match-search"
            placeholder="Search teams, leagues..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 bg-card border-card-border text-white placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={country} onValueChange={v => { setCountry(v); setPage(1); }}>
            <SelectTrigger className="w-40 bg-card border-card-border text-white" data-testid="select-country">
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent className="bg-card border-card-border">
              <SelectItem value="all">All Countries</SelectItem>
              {countries?.map(c => (
                <SelectItem key={c.name} value={c.name}>{c.flag} {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={leagueId} onValueChange={v => { setLeagueId(v); setPage(1); }}>
            <SelectTrigger className="w-48 bg-card border-card-border text-white" data-testid="select-league">
              <SelectValue placeholder="League" />
            </SelectTrigger>
            <SelectContent className="bg-card border-card-border">
              <SelectItem value="all">All Leagues</SelectItem>
              {leagues?.map(l => (
                <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-36 bg-card border-card-border text-white" data-testid="select-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-card-border">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="finished">Finished</SelectItem>
            </SelectContent>
          </Select>

          <Select value={groupBy} onValueChange={v => setGroupBy(v as "none" | "league" | "country")}>
            <SelectTrigger className="w-40 bg-card border-card-border text-white" data-testid="select-group-by">
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent className="bg-card border-card-border">
              <SelectItem value="none">No Grouping</SelectItem>
              <SelectItem value="league">By League</SelectItem>
              <SelectItem value="country">By Country</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground hover:text-white" data-testid="button-reset-filters">
              Clear Filters
            </Button>
          )}

          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("grid")}
              className={viewMode === "grid" ? "text-primary" : "text-muted-foreground"}
              data-testid="button-view-grid"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "text-primary" : "text-muted-foreground"}
              data-testid="button-view-list"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {matchData && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-border text-muted-foreground text-xs">
              {matchData.total} match{matchData.total !== 1 ? "es" : ""} found
            </Badge>
          </div>
        )}
      </div>

      {/* Match Grid */}
      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full bg-muted rounded-xl" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-xl">
          <Search className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-white font-medium">No matches found</p>
          <p className="text-muted-foreground text-sm mt-1">Try adjusting your filters</p>
          <Button variant="outline" size="sm" onClick={resetFilters} className="mt-4" data-testid="button-empty-reset">Reset Filters</Button>
        </div>
      ) : grouped ? (
        <div className="space-y-8">
          {Object.entries(grouped).map(([key, groupMatches]) => (
            <div key={key}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-base font-semibold text-white">{key}</h2>
                <Badge variant="outline" className="border-border text-muted-foreground text-xs">{groupMatches.length}</Badge>
              </div>
              <div className={viewMode === "grid" ? "grid gap-3 md:grid-cols-2" : "space-y-2"}>
                {groupMatches.map(m => <MatchCard key={m.id} match={m} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={viewMode === "grid" ? "grid gap-3 md:grid-cols-2" : "space-y-2"}>
          {matches.map(m => <MatchCard key={m.id} match={m} />)}
        </div>
      )}

      {/* Pagination */}
      {matchData && matchData.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="border-border text-white"
            data-testid="button-prev-page"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {matchData.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(matchData.totalPages, p + 1))}
            disabled={page === matchData.totalPages}
            className="border-border text-white"
            data-testid="button-next-page"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function groupMatches(matches: ReturnType<typeof useListMatches>["data"] extends { matches: infer M } ? M : never[], key: "league" | "country") {
  return matches.reduce(
    (acc, m) => {
      const k = key === "league" ? m.league : m.country;
      if (!acc[k]) acc[k] = [];
      acc[k].push(m);
      return acc;
    },
    {} as Record<string, typeof matches>
  );
}
