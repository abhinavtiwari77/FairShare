import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Calculator, MessageSquare, PieChart, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Landing() {
  const { user, loading } = useAuth();

  if (loading) return null;
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <PieChart className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">FairShare</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Log in
            </Link>
            <Link to="/register">
              <Button>Sign Up</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        
        {/* Hero Section */}
        <section className="py-24 md:py-32 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10" />
          <div className="container mx-auto max-w-4xl text-center space-y-8">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
              Track shared expenses without the spreadsheets.
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-light">
              Split bills, manage group expenses, track balances, and settle up effortlessly with your friends and roommates.
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Link to="/register">
                <Button size="lg" className="h-12 px-8 text-base">
                  Get Started <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="h-12 px-8 text-base bg-background/50 backdrop-blur-sm">
                  Log in
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Product Preview */}
        <section className="pb-24 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="rounded-xl border bg-card/50 backdrop-blur-xl shadow-2xl p-2 md:p-4 ring-1 ring-white/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="rounded-lg border bg-background overflow-hidden aspect-[16/9] flex items-center justify-center">
                <div className="w-full h-full p-4 md:p-8 flex flex-col gap-4">
                  {/* Mockup Top */}
                  <div className="flex items-center justify-between border-b pb-4">
                    <div className="h-6 w-32 bg-muted rounded-md animate-pulse" />
                    <div className="flex gap-2">
                      <div className="h-8 w-24 bg-primary/20 rounded-md" />
                    </div>
                  </div>
                  {/* Mockup Body */}
                  <div className="flex-1 flex gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="h-16 w-full bg-muted/50 rounded-lg flex items-center justify-between p-4">
                        <div className="space-y-2">
                          <div className="h-4 w-24 bg-muted rounded" />
                          <div className="h-3 w-16 bg-muted/60 rounded" />
                        </div>
                        <div className="h-6 w-16 bg-positive/20 rounded" />
                      </div>
                      <div className="h-16 w-full bg-muted/50 rounded-lg flex items-center justify-between p-4">
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-muted rounded" />
                          <div className="h-3 w-20 bg-muted/60 rounded" />
                        </div>
                        <div className="h-6 w-20 bg-destructive/20 rounded" />
                      </div>
                    </div>
                    <div className="hidden md:block w-1/3 border-l pl-4 space-y-4">
                      <div className="h-8 w-full bg-muted/30 rounded" />
                      <div className="h-32 w-full bg-muted/30 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 bg-muted/30 px-4 border-y">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Everything you need to stay balanced.</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                FairShare is built to eliminate the awkwardness of money with powerful, intuitive tools.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 border-transparent shadow-none bg-background/60 hover:bg-background transition-colors">
                <Calculator className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Smart Expense Splitting</h3>
                <p className="text-muted-foreground">Split equally, by exact amounts, percentages, or shares. The engine calculates the cents perfectly every time.</p>
              </Card>
              <Card className="p-6 border-transparent shadow-none bg-background/60 hover:bg-background transition-colors">
                <MessageSquare className="w-10 h-10 text-blue-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Real-Time Expense Chat</h3>
                <p className="text-muted-foreground">Discuss details and share receipts directly on the expense. Messages sync instantly across all your devices.</p>
              </Card>
              <Card className="p-6 border-transparent shadow-none bg-background/60 hover:bg-background transition-colors">
                <PieChart className="w-10 h-10 text-amber-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Group Balance Tracking</h3>
                <p className="text-muted-foreground">See an optimized list of exactly who owes whom. Debt simplification means fewer transactions to settle up.</p>
              </Card>
              <Card className="p-6 border-transparent shadow-none bg-background/60 hover:bg-background transition-colors">
                <Zap className="w-10 h-10 text-emerald-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Fast Settlements</h3>
                <p className="text-muted-foreground">Record payments quickly. Balances update instantly without affecting the historical expense ledger.</p>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-16">How it works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg mb-4">1</div>
                <h4 className="font-semibold mb-2">Create Group</h4>
                <p className="text-sm text-muted-foreground">Invite your friends via email.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg mb-4">2</div>
                <h4 className="font-semibold mb-2">Add Expenses</h4>
                <p className="text-sm text-muted-foreground">Log costs and split them.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg mb-4">3</div>
                <h4 className="font-semibold mb-2">Track Balances</h4>
                <p className="text-sm text-muted-foreground">See who owes whom instantly.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg mb-4">4</div>
                <h4 className="font-semibold mb-2">Settle Up</h4>
                <p className="text-sm text-muted-foreground">Record payments to clear debts.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-4 border-t bg-muted/10">
          <div className="container mx-auto max-w-3xl text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Ready to simplify shared expenses?</h2>
            <p className="text-xl text-muted-foreground">
              Join FairShare today and stop worrying about who paid for what.
            </p>
            <div className="pt-4">
              <Link to="/register">
                <Button size="lg" className="h-12 px-8 text-base">
                  Create your free account
                </Button>
              </Link>
            </div>
            <ul className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-8 text-sm text-muted-foreground font-medium">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> No credit card required</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Unlimited groups</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Free forever</li>
            </ul>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <PieChart className="w-5 h-5" />
            <span className="font-semibold">FairShare</span>
            <span className="text-sm">&copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="#" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="#" className="hover:text-foreground transition-colors">Terms</Link>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
