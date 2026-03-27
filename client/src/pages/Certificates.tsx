import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Certificates() {
  const { data: certificates, isLoading } = trpc.certificate.getMyCertificates.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Certificates</h1>
        <p className="text-muted-foreground">View and download your earned certificates.</p>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : !certificates || certificates.length === 0 ? (
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <Award className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">No certificates earned yet. Complete lessons to earn certificates.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {certificates.map((cert: any) => (
            <Card key={cert.id} className="hover:border-primary/20 transition-colors">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Lesson #{cert.lessonId}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Certificate #{cert.certificateNumber}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Issued {new Date(cert.issuedAt).toLocaleDateString()}
                      </span>
                      {cert.expiresAt && (
                        <Badge variant="outline" className="text-[10px]">
                          Expires {new Date(cert.expiresAt).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {cert.pdfUrl && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={cert.pdfUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
